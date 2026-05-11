"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SettlementPayload {
  operator_id: string;
  ticket_ids: string[];
  total_amount: number;
  commission_percentage: number;
  commission_amount: number;
  payable_amount: number;
  paid_amount: number;
  payment_method: "Cash" | "UPI" | "Bank Transfer";
  account_id: string;
  received_by: string;
  receiver_mobile: string;
  reference_number?: string;
}

export async function getAllOperatorTickets(operatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_bookings")
    .select(`
      *,
      pickup_city:cities!pickup_city_id(name),
      drop_city:cities!drop_city_id(name),
      account:accounts(name)
    `)
    .eq("operator_id", operatorId)
    .order("journey_date", { ascending: false });

  if (error) {
    console.error("Error fetching all operator tickets:", error);
    return [];
  }
  return data;
}

export async function getUnsettledTickets(operatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_bookings")
    .select(`
      *,
      pickup_city:cities!pickup_city_id(name),
      drop_city:cities!drop_city_id(name)
    `)
    .eq("operator_id", operatorId)
    .is("settlement_id", null)
    .order("journey_date", { ascending: true });

  if (error) {
    console.error("Error fetching unsettled tickets:", error);
    return [];
  }
  return data;
}

export async function processSettlement(data: SettlementPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: tickets, error: ticketFetchError } = await supabase
    .from("ticket_bookings")
    .select("id, operator_id, settlement_id, amount")
    .in("id", data.ticket_ids);

  if (ticketFetchError) throw new Error(ticketFetchError.message);

  if (!tickets || tickets.length !== data.ticket_ids.length) {
    throw new Error("Some selected tickets were not found.");
  }

  const hasInvalidTicket = tickets.some(
    (ticket) => ticket.operator_id !== data.operator_id || ticket.settlement_id,
  );

  if (hasInvalidTicket) {
    throw new Error("Selected tickets must be unsettled and belong to the same operator.");
  }

  // 1. Create Settlement Record
  const { data: settlement, error: sError } = await supabase
    .from("operator_settlements")
    .insert([
      {
        operator_id: data.operator_id,
        total_amount: data.total_amount,
        commission_percentage: data.commission_percentage,
        commission_amount: data.commission_amount,
        payable_amount: data.payable_amount,
        paid_amount: data.paid_amount,
        received_by: data.received_by,
        receiver_mobile: data.receiver_mobile,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (sError) throw new Error(sError.message);

  // 2. Update Tickets with settlement ID and snapshot data
  const { error: tError } = await supabase
    .from("ticket_bookings")
    .update({
      settlement_id: settlement.id,
      paid_to_operator_name: data.received_by,
      paid_to_operator_mobile: data.receiver_mobile,
      paid_at: new Date().toISOString()
    })
    .in("id", data.ticket_ids);

  if (tError) {
    await supabase.from("operator_settlements").delete().eq("id", settlement.id);
    throw new Error(tError.message);
  }

  // 3. Deduct Operator Payable from Income Entries
  // The remaining amount in the system should be the final income (commission automatically retained)
  for (const ticket of tickets) {
    if (ticket.amount && ticket.amount > 0) {
      const finalIncomeAmount = (ticket.amount * data.commission_percentage) / 100;

      const { error: entryUpdateError } = await supabase
        .from("entries")
        .update({ amount: finalIncomeAmount })
        .ilike("remarks", `%[TID:${ticket.id}]%`);

      if (entryUpdateError) {
        console.error(`Failed to update entry for ticket ${ticket.id}:`, entryUpdateError);
      }
    }
  }

  revalidatePath("/ticket-booking");
  revalidatePath("/operators");
  revalidatePath("/accounting");
  return settlement;
}

export async function getOperatorSettlements(operatorId?: string) {
  const supabase = await createClient();

  // 1. Fetch settlements
  let settlementQuery = supabase
    .from("operator_settlements")
    .select(`
      *,
      operator:operators(operator_name, mobile_number)
    `)
    .order("created_at", { ascending: false });

  if (operatorId) {
    settlementQuery = settlementQuery.eq("operator_id", operatorId);
  }

  const { data: settlements, error: sError } = await settlementQuery;

  if (sError) {
    console.error(`Error fetching settlements: ${sError.message}`);
    return [];
  }

  if (!settlements || settlements.length === 0) return [];

  // 2. Fetch all tickets for these settlements
  const settlementIds = settlements.map(s => s.id);
  const { data: allTickets, error: tError } = await supabase
    .from("ticket_bookings")
    .select(`
      id,
      ticket_number,
      passenger_name,
      mobile_number,
      journey_date,
      seat_numbers,
      total_seats,
      amount,
      payment_type,
      settlement_id
    `)
    .in("settlement_id", settlementIds);

  if (tError) {
    // If column doesn't exist, log it but don't crash the app
    if (tError.code === "PGRST204" || tError.message.includes("column") && tError.message.includes("does not exist")) {
      console.warn("Settlement columns are missing in the database. Please run migrations.");
    } else {
      console.error(`Error fetching settlement tickets: ${tError.message}`);
    }
    // Still return settlements even if tickets fail
    return settlements.map(s => ({ ...s, tickets: [] }));
  }

  // 3. Map tickets to their settlements
  const settlementsWithTickets = settlements.map(settlement => ({
    ...settlement,
    tickets: allTickets.filter(t => t.settlement_id === settlement.id)
  }));

  return settlementsWithTickets;
}
