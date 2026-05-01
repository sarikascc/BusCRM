"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createEntry, Account, Category } from "@/lib/actions/accounting.actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: "Income" | "Expense";
  accounts: Account[];
  categories: Category[];
}

export default function AddEntryModal({ isOpen, onClose, onSuccess, type, accounts, categories }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_id: "",
    category_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.category_id || !formData.amount || !formData.date) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEntry({
        ...formData,
        amount: parseFloat(formData.amount),
        type,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.message);
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
          <h3 className={`text-lg font-bold ${type === "Income" ? "text-emerald-700" : "text-rose-700"}`}>
            Add {type}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account *</label>
            <select 
              required
              className="input-primary"
              value={formData.account_id}
              onChange={(e) => setFormData({...formData, account_id: e.target.value})}
            >
              <option value="">Select Account</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</label>
            <select 
              required
              className="input-primary"
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
            >
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount *</label>
              <input 
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="input-primary"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date *</label>
              <input 
                required
                type="date"
                className="input-primary"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</label>
            <textarea 
              rows={3}
              placeholder="Optional notes..."
              className="input-primary resize-none"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              type === "Income" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : `Save ${type}`}
          </button>
        </form>
      </div>
    </div>
  );
}
