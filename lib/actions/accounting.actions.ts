"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Account {
  id: string;
  name: string;
  opening_balance: number;
  status: "Active" | "Inactive";
  created_at: string;
  total_in: number;
  total_out: number;
  current_balance: number;
}

export interface Category {
  id: string;
  name: string;
  type: "Income" | "Expense";
  status: "Active" | "Inactive";
  created_at: string;
}

export interface Entry {
  id: string;
  account_id: string;
  category_id: string;
  amount: number;
  date: string;
  type: "Income" | "Expense";
  remarks?: string;
  created_at: string;
  account?: { name: string };
  category?: { name: string };
}

// --- ACCOUNTS ---

export async function getAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      *,
      entries(amount, type)
    `)
    .order("name");

  if (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }

  return (data as any[]).map((acc) => {
    const total_in = acc.entries
      ?.filter((e: any) => e.type === "Income")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    const total_out = acc.entries
      ?.filter((e: any) => e.type === "Expense")
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
    
    return {
      ...acc,
      total_in,
      total_out,
      current_balance: Number(acc.opening_balance) + total_in - total_out,
    };
  }) as Account[];
}

export async function createAccount(data: Omit<Account, "id" | "created_at">) {
  const supabase = await createClient();
  const { data: newAccount, error } = await supabase
    .from("accounts")
    .insert([data])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return newAccount;
}

export async function updateAccount(id: string, data: Partial<Account>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update(data)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  
  // Check if entries exist
  const { count } = await supabase
    .from("entries")
    .select("*", { count: "exact", head: true })
    .eq("account_id", id);

  if (count && count > 0) {
    throw new Error("Cannot delete account with existing entries.");
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
}

// --- CATEGORIES ---

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data as Category[];
}

export async function createCategory(data: Omit<Category, "id" | "created_at">) {
  const supabase = await createClient();
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert([data])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return newCategory;
}

export async function updateCategory(id: string, data: Partial<Category>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(data)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  // Check if entries exist
  const { count } = await supabase
    .from("entries")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    throw new Error("Cannot delete category linked to entries.");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
}

// --- ENTRIES ---

export async function getEntries(filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
  accountId?: string;
  categoryId?: string;
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("entries")
    .select(`
      *,
      account:accounts(name),
      category:categories(name)
    `)
    .order("created_at", { ascending: false });

  if (filters?.startDate) query = query.gte("date", filters.startDate);
  if (filters?.endDate) query = query.lte("date", filters.endDate);
  if (filters?.type && filters.type !== "Both") query = query.eq("type", filters.type);
  if (filters?.accountId) query = query.eq("account_id", filters.accountId);
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.search) query = query.ilike("remarks", `%${filters.search}%`);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching entries:", error);
    return [];
  }
  return data as Entry[];
}

export async function createEntry(data: Omit<Entry, "id" | "created_at">) {
  const supabase = await createClient();
  
  // Validate account and category are active
  const { data: account } = await supabase.from("accounts").select("status").eq("id", data.account_id).single();
  if (account?.status !== "Active") throw new Error("Selected account is inactive.");

  const { data: category } = await supabase.from("categories").select("status").eq("id", data.category_id).single();
  if (category?.status !== "Active") throw new Error("Selected category is inactive.");

  const { data: newEntry, error } = await supabase
    .from("entries")
    .insert([data])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return newEntry;
}

export async function updateEntry(id: string, data: Partial<Entry>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("entries")
    .update(data)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
}

export async function deleteEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
}

export async function getAccountingSummary(filters?: any) {
  const entries = await getEntries(filters);
  const totalIncome = entries.filter(e => e.type === "Income").reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === "Expense").reduce((sum, e) => sum + e.amount, 0);
  
  return {
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    count: entries.length
  };
}
