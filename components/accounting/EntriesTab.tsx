"use client";

import { createElement, useMemo, useState, useEffect } from "react";
import { Plus, Search, Download, RotateCcw, Trash2, Edit2 } from "lucide-react";
import { Entry, Account, Category, deleteEntry, getEntries } from "@/lib/actions/accounting.actions";
import AddEntryModal from "./AddEntryModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

interface Props {
  initialEntries: Entry[];
  accounts: Account[];
  categories: Category[];
}

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

export default function EntriesTab({ initialEntries, accounts, categories }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"Income" | "Expense">("Income");
  const [mounted, setMounted] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    type: "Both",
    accountId: "",
    categoryId: "",
  });

  const summary = useMemo(() => {
    const income = entries.filter((e) => e.type === "Income").reduce((sum, e) => sum + e.amount, 0);
    const expense = entries.filter((e) => e.type === "Expense").reduce((sum, e) => sum + e.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
      count: entries.length,
    };
  }, [entries]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      startDate: "",
      endDate: "",
      type: "Both",
      accountId: "",
      categoryId: "",
    });
    setEntries(initialEntries);
  };

  // Auto-apply filters when any filter value changes
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const filteredEntries = await getEntries(filters);
      setEntries(filteredEntries);
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  const handleDelete = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteEntry(entryToDelete.id);
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      toast.success("Entry deleted successfully");
      setEntryToDelete(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50/30">
        <SummaryCard label="Total Income" value={summary.income} color="text-emerald-600" bgColor="bg-emerald-50" mounted={mounted} />
        {/* <SummaryCard label="Total Expense" value={summary.expense} color="text-rose-600" bgColor="bg-rose-50" mounted={mounted} /> */}
        <SummaryCard label="Net Amount" value={summary.net} color={summary.net >= 0 ? "text-[#3da9d4]" : "text-rose-600"} bgColor="bg-slate-50" mounted={mounted} />
        <SummaryCard label="Transactions" value={summary.count} color="text-slate-600" bgColor="bg-slate-100" isCurrency={false} mounted={mounted} />
      </div>

      <div className="px-6 py-4 border-y border-slate-100 flex flex-wrap items-center gap-4 bg-white sticky top-0 z-10">
        <div className="flex gap-2 mr-auto">
          <button
            onClick={() => { setModalType("Income"); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Plus size={18} /> Add Income
          </button>
          <button
            onClick={() => { setModalType("Expense"); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-sm"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              name="search"
              placeholder="Search remarks..."
              value={filters.search}
              onChange={handleFilterChange}
              className="input-primary pl-10 w-48 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-primary py-2 w-36" />
            <span className="text-slate-400">to</span>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-primary py-2 w-36" />
          </div>

          <select name="type" value={filters.type} onChange={handleFilterChange} className="input-primary py-2 w-32">
            <option value="Both">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          <select name="accountId" value={filters.accountId} onChange={handleFilterChange} className="input-primary py-2 w-40">
            <option value="">All Accounts</option>
            {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} </option>)}
          </select>

          <button onClick={resetFilters} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all">
            <RotateCcw size={18} />
          </button>
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-all">
            <Download size={16} /> Export
          </button> */}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Account</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No transactions found.</td></tr>
            ) : (
              entries.map((entry) =>
                createElement(
                  "tr",
                  {
                    key: entry.id,
                    className: "hover:bg-slate-50/50 transition-colors group",
                  },
                  [
                    <td key="date" className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {mounted ? new Date(entry.date).toLocaleDateString() : entry.date}
                    </td>,
                    <td key="type" className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.type === "Income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}>
                        {entry.type}
                      </span>
                    </td>,
                    <td key="account" className="px-6 py-4 text-sm text-slate-800 font-bold">{entry.account?.name}</td>,
                    <td key="category" className="px-6 py-4 text-sm text-slate-600">{entry.category?.name}</td>,
                    <td key="amount" className={`px-6 py-4 text-sm text-right font-black ${entry.type === "Income" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                      {entry.type === "Income" ? "+" : "-"} {formatCurrency(entry.amount)}
                    </td>,
                    <td key="remarks" className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]">{(entry.remarks || "-").replace(/\s*\[TID:[^\]]+\]/g, "").replace(/(Operator Settlement):\s*[a-fA-F0-9\-]+/g, "$1")}</td>,
                    <td key="actions" className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <button onClick={() => setEntryToDelete(entry)} className="p-1.5 text-rose-400 hover:bg-rose-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>,
                  ]
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddEntryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={modalType}
          accounts={accounts.filter((a) => a.status === "Active")}
          categories={categories.filter((c) => c.type === modalType && c.status === "Active")}
          onSuccess={async () => {
            const updated = await getEntries(filters);
            setEntries(updated);
            setIsModalOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(entryToDelete)}
        title="Delete Entry"
        description={
          <>
            Are you sure you want to delete this{" "}
            <strong className="font-bold text-slate-700">
              {entryToDelete?.type?.toLowerCase()}
            </strong>{" "}
            entry? This action cannot be undone.
          </>
        }
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
        onCancel={() => setEntryToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  isCurrency?: boolean;
  mounted: boolean;
}

function SummaryCard({ label, value, color, bgColor, isCurrency = true, mounted }: SummaryCardProps) {
  return (
    <div className={`${bgColor} p-4 rounded-2xl border border-slate-100 flex flex-col gap-1`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-xl font-black ${color}`}>
        {mounted && isCurrency ? formatCurrency(value) : (isCurrency ? `₹${value}` : value)}
      </span>
    </div>
  );
}
