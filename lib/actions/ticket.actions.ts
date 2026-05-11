"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateTicketPayload {
  operator_id?: string;
  pickup_city_id: string;
  drop_city_id: string;
  journey_date: string;
  booking_date?: string;
  passenger_name: string;
  mobile_number: string;
  seat_numbers: string;
  total_seats: number;
  pickup_time: string;
  bus_number?: string;
  travel_type: "AC" | "Non-AC";
  ticket_number?: string;
  account_id?: string;
  payment_type?: "Cash" | "UPI";
  amount?: number;
  remarks?: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getOrCreateCategory(supabase: SupabaseServerClient) {
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("name", "Ticket Booking")
    .eq("type", "Income")
    .single();

  if (catError || !category) {
    const { data: newCat, error: newCatError } = await supabase
      .from("categories")
      .insert([{ name: "Ticket Booking", type: "Income", status: "Active" }])
      .select()
      .single();
    if (newCatError) {
      console.error("Error creating category:", newCatError);
      return null;
    }
    return newCat?.id;
  }
  return category.id;
}

export async function createTicketBooking(data: CreateTicketPayload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("You must be logged in.");

  const { data: newTicket, error } = await supabase
    .from("ticket_bookings")
    .insert([{ ...data, created_by: user.id }])
    .select()
    .single();

  if (error) {
    console.error("Error creating ticket:", error);
    throw new Error(error.message);
  }

  // --- Sync with Accounting ---
  if (data.account_id && data.amount && data.amount > 0) {
    try {
      const categoryId = await getOrCreateCategory(supabase);
      if (categoryId) {
        await supabase.from("entries").insert([
          {
            account_id: data.account_id,
            category_id: categoryId,
            amount: data.amount,
            type: "Income",
            date: data.booking_date || new Date().toISOString().split("T")[0],
            remarks: `Ticket Booking: ${data.passenger_name}${data.ticket_number ? ` (No: ${data.ticket_number})` : ""} [TID:${newTicket.id}]`,
          },
        ]);
      }
    } catch (accError) {
      console.error("Accounting sync failed:", accError);
    }
  }

  revalidatePath("/ticket-booking");
  revalidatePath("/accounting");
  revalidatePath("/operators");
  return newTicket;
}

export async function getTicketBookings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_bookings")
    .select(`
      *,
      pickup_city:cities!pickup_city_id(name),
      drop_city:cities!drop_city_id(name),
      operator:operators(operator_name, mobile_number, commission_percentage),
      account:accounts(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return data;
}

export async function deleteTicketBooking(id: string) {
  const supabase = await createClient();

  // Delete associated entry first
  await supabase
    .from("entries")
    .delete()
    .ilike("remarks", `%[TID:${id}]%`);

  const { error } = await supabase
    .from("ticket_bookings")
    .delete()
    .match({ id });

  if (error) {
    console.error("Error deleting ticket:", error);
    throw new Error(error.message);
  }

  revalidatePath("/ticket-booking");
  revalidatePath("/accounting");
}

export async function updateTicketBooking(id: string, data: Partial<CreateTicketPayload>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ticket_bookings")
    .update(data)
    .eq("id", id);

  if (error) {
    console.error("Error updating ticket:", error);
    throw new Error(error.message);
  }

  // --- Sync with Accounting ---
  // Get full ticket data for sync
  const { data: ticket } = await supabase
    .from("ticket_bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (ticket && ticket.account_id && ticket.amount > 0) {
    try {
      const categoryId = await getOrCreateCategory(supabase);
      if (categoryId) {
        // Try to find existing entry
        const { data: existingEntry } = await supabase
          .from("entries")
          .select("id")
          .ilike("remarks", `%[TID:${id}]%`)
          .single();

        if (existingEntry) {
          await supabase
            .from("entries")
            .update({
              account_id: ticket.account_id,
              amount: ticket.amount,
              date: ticket.booking_date || ticket.created_at.split("T")[0],
              remarks: `Ticket Booking: ${ticket.passenger_name}${ticket.ticket_number ? ` (No: ${ticket.ticket_number})` : ""} [TID:${id}]`,
            })
            .eq("id", existingEntry.id);
        } else {
          // Create if not exists
          await supabase.from("entries").insert([
            {
              account_id: ticket.account_id,
              category_id: categoryId,
              amount: ticket.amount,
              type: "Income",
              date: ticket.booking_date || ticket.created_at.split("T")[0],
              remarks: `Ticket Booking: ${ticket.passenger_name}${ticket.ticket_number ? ` (No: ${ticket.ticket_number})` : ""} [TID:${id}]`,
            },
          ]);
        }
      }
    } catch (accError) {
      console.error("Accounting sync failed during update:", accError);
    }
  } else if (ticket && (!ticket.account_id || ticket.amount <= 0)) {
    // If account removed or amount is 0, remove entry
    await supabase
      .from("entries")
      .delete()
      .ilike("remarks", `%[TID:${id}]%`);
  }
  revalidatePath("/ticket-booking");
  revalidatePath("/accounting");
  revalidatePath("/operators");
}
