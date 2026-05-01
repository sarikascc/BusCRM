"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Operator {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

export async function getOperators() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operators")
    .select("*")
    .order("operator_name");

  if (error) {
    console.error("Error fetching operators:", error);
    return [];
  }
  return data as Operator[];
}

export async function createOperator(data: Omit<Operator, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const { data: newOperator, error } = await supabase
    .from("operators")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("Error creating operator:", error);
    throw new Error(error.message);
  }
  revalidatePath("/operators");
  return newOperator;
}

export async function updateOperator(id: string, data: Partial<Operator>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("operators")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error updating operator:", error);
    throw new Error(error.message);
  }
  revalidatePath("/operators");
}

export async function deleteOperator(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("operators").delete().eq("id", id);

  if (error) {
    console.error("Error deleting operator:", error);
    throw new Error(error.message);
  }
  revalidatePath("/operators");
}
