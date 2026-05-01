"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateTicketPayload {
  operator_id?: string;
  pickup_city_id: string;
  pickup_area: string;
  drop_city_id: string;
  drop_location: string;
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
      // 1. Get or Create "Ticket Booking" Category
      let categoryId;
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
        if (newCatError) console.error("Error creating category:", newCatError);
        categoryId = newCat?.id;
      } else {
        categoryId = category.id;
      }

      // 2. Create Entry
      if (categoryId) {
        const { error: entryError } = await supabase.from("entries").insert([
          {
            account_id: data.account_id,
            category_id: categoryId,
            amount: data.amount,
            type: "Income",
            date: data.booking_date || new Date().toISOString().split("T")[0],
            remarks: `Ticket Booking: ${data.passenger_name} (${data.ticket_number || "No Ticket #"})`,
          },
        ]);

        if (entryError) console.error("Error creating accounting entry:", entryError);
      }
    } catch (accError) {
      console.error("Accounting sync failed:", accError);
    }
  }

  revalidatePath("/ticket-booking");
  revalidatePath("/accounting");
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
      operator:operators(operator_name),
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
  const { error } = await supabase
    .from("ticket_bookings")
    .delete()
    .match({ id });

  if (error) {
    console.error("Error deleting ticket:", error);
    throw new Error(error.message);
  }

  revalidatePath("/ticket-booking");
}
