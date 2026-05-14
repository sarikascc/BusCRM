"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Wallet, Tag, Calendar, MessageSquare, CheckCircle2 } from "lucide-react";
import { createEntry, updateEntry, Account, Category, Entry } from "@/lib/actions/accounting.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: "Income" | "Expense";
  accounts: Account[];
  categories: Category[];
  entry?: Entry | null;
}

export default function AddEntryModal({ isOpen, onClose, onSuccess, type, accounts, categories, entry }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_id: "",
    category_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // Filter active accounts and categories
  const activeAccounts = accounts.filter(a => a.status === "Active");
  const activeCategories = categories.filter(c => c.status === "Active" && c.type === type);

  useEffect(() => {
    if (isOpen) {
      if (entry) {
        setFormData({
          account_id: entry.account_id,
          category_id: entry.category_id,
          amount: entry.amount.toString(),
          date: entry.date ? new Date(entry.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          remarks: entry.remarks ? entry.remarks.replace(/\s*\[TID:[^\]]+\]/g, "").replace(/(Operator Settlement):\s*[a-fA-F0-9\-]+/g, "$1") : "",
        });
      } else {
        setFormData({
          account_id: "",
          category_id: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          remarks: "",
        });
      }
    }
  }, [isOpen, entry]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.category_id || !formData.amount || !formData.date) {
      toast.error("Please fill all required fields.", { duration: 6000 });
      return;
    }

    setIsSubmitting(true);
    try {
      if (entry) {
        await updateEntry(entry.id, {
          ...formData,
          amount: parseFloat(formData.amount),
          type,
        });
        toast.success(`${type} updated successfully`);
      } else {
        await createEntry({
          ...formData,
          amount: parseFloat(formData.amount),
          type,
        });
        toast.success(`${type} recorded successfully`);
      }
      onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className={`p-6 flex items-center justify-between border-b border-slate-100 ${
          type === "Income" ? "bg-emerald-50/50" : "bg-rose-50/50"
        }`}>
          <div>
            <h3 className={`text-lg font-bold ${type === "Income" ? "text-emerald-700" : "text-rose-700"}`}>
              {entry ? `Update ${type}` : `Record ${type}`}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Enter transaction details below
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Wallet size={12} className="text-[#3da9d4]" /> Select Account *
            </label>
            <select 
              required
              className="input-primary h-11 appearance-none bg-white font-bold text-sm"
              value={formData.account_id}
              onChange={(e) => setFormData({...formData, account_id: e.target.value})}
            >
              <option value="">Select Account</option>
              {activeAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Tag size={12} className="text-[#3da9d4]" /> Select Category *
            </label>
            <select 
              required
              className="input-primary h-11 appearance-none bg-white font-bold text-sm"
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
            >
              <option value="">Select Category</option>
              {activeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input 
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="input-primary h-11 pl-7 font-black text-slate-800"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" /> Date *
              </label>
              <input 
                required
                type="date"
                className="input-primary h-11 font-bold text-sm"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <MessageSquare size={12} className="text-slate-400" /> Remarks
            </label>
            <textarea 
              rows={2}
              placeholder="What is this for?"
              className="input-primary resize-none py-2.5 text-sm font-medium"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 ${
              type === "Income" 
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" 
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <CheckCircle2 size={18} />
                {entry ? "Update" : "Save"} {type} Entry
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
