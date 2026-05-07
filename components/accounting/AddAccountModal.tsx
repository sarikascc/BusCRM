"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Loader2, ArrowUpCircle, ArrowDownCircle, Wallet, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { createAccount, updateAccount, getEntries, Entry, Account } from "@/lib/actions/accounting.actions";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: Account | null;
  isViewOnly?: boolean;
}

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function AddAccountModal({ isOpen, onClose, onSuccess, account, isViewOnly }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    opening_balance: "0",
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        opening_balance: account.opening_balance.toString(),
        status: account.status as "Active" | "Inactive",
      });
      if (isViewOnly) fetchAccountEntries();
    } else {
      setFormData({
        name: "",
        opening_balance: "0",
        status: "Active",
      });
      setEntries([]);
    }
  }, [account, isOpen]);

  async function fetchAccountEntries() {
    if (!account?.id) return;
    setIsLoadingEntries(true);
    try {
      const data = await getEntries({ accountId: account.id });
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    } finally {
      setIsLoadingEntries(false);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Account name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        opening_balance: parseFloat(formData.opening_balance),
      };

      if (account) {
        await updateAccount(account.id, data);
        toast.success("Account updated successfully");
      } else {
        await createAccount(data as any);
        toast.success("Account created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {isViewOnly ? "Account Ledger" : (account ? "Update Account" : "Add New Account")}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {isViewOnly ? `Transaction history for ${account?.name}` : (account ? "Modify existing account details" : "Create a new financial ledger")}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {account && (
            <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <ArrowUpCircle size={10} className="text-emerald-500" /> Total In
                </span>
                <span className="text-sm font-black text-emerald-600">{formatCurrency(account.total_in || 0)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <ArrowDownCircle size={10} className="text-rose-500" /> Total Out
                </span>
                <span className="text-sm font-black text-rose-600">{formatCurrency(account.total_out || 0)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Wallet size={10} className="text-[#3da9d4]" /> Balance
                </span>
                <span className="text-sm font-black text-[#3da9d4]">{formatCurrency(account.current_balance || 0)}</span>
              </div>
            </div>
          )}

          {!isViewOnly && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Account Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Cash, HDFC Bank"
                  className="input-primary h-11"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-primary h-11 font-bold text-[#3da9d4]"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  disabled={!!account} // Disable opening balance edit for safety
                />
                {account && <p className="text-[10px] text-slate-400 italic px-1">Opening balance cannot be changed once created.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[10px] h-11">
                  {["Active", "Inactive"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: status as any })}
                      className={`flex-1 text-[10px] font-bold uppercase tracking-wider rounded-[10px] transition-all ${formData.status === status
                        ? "bg-white text-[#3da9d4] shadow-sm border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {isViewOnly && account && (
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <History size={12} className="text-[#3da9d4]" /> Account Ledger
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{entries.length} Transactions</span>
              </div>

              <div className="space-y-2">
                {isLoadingEntries ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3da9d4]" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Entries...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">No transactions found for this account.</p>
                  </div>
                ) : (
                  entries.slice(0, 20).map((entry) => (
                    <div key={entry.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 group hover:border-[#3da9d4]/30 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${entry.type === "Income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}>
                          {entry.type === "Income" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1">
                            {entry.category?.name || "General"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                            {new Date(entry.date).toLocaleDateString("en-GB")}
                            {entry.remarks && ` • ${entry.remarks.replace(/\s*\[TID:[^\]]+\]/g, "").replace(/(Operator Settlement):\s*[a-fA-F0-9\-]+/g, "$1")}`}
                          </p>
                        </div>
                      </div>
                      <div className={`text-sm font-black shrink-0 ${entry.type === "Income" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                        {entry.type === "Income" ? "+" : "-"} {formatCurrency(entry.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {isViewOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 shrink-0"
            >
              Close Ledger
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand/20 hover:bg-brand-hover transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 shrink-0"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (account ? "Update Account" : "Create Account")}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
