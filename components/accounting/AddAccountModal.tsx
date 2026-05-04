"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createAccount, updateAccount } from "@/lib/actions/accounting.actions";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: any | null;
}

export default function AddAccountModal({ isOpen, onClose, onSuccess, account }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        status: account.status,
      });
    } else {
      setFormData({
        name: "",
        opening_balance: "0",
        status: "Active",
      });
    }
  }, [account, isOpen]);

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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {account ? "Update Account" : "Add New Account"}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {account ? "Modify existing account details" : "Create a new financial ledger"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Account Name *</label>
            <input 
              required
              type="text"
              placeholder="e.g. Cash, HDFC Bank"
              className="input-primary h-11"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Opening Balance</label>
            <input 
              type="number"
              step="0.01"
              className="input-primary h-11 font-bold text-[#3da9d4]"
              value={formData.opening_balance}
              onChange={(e) => setFormData({...formData, opening_balance: e.target.value})}
              disabled={!!account} // Disable opening balance edit for safety
            />
            {account && <p className="text-[10px] text-slate-400 italic px-1">Opening balance cannot be changed once created.</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Status</label>
            <div className="flex gap-2">
              {["Active", "Inactive"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({...formData, status: status as any})}
                  className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${
                    formData.status === status 
                      ? "bg-slate-800 text-white border-slate-800 shadow-md" 
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand/20 hover:bg-brand-hover transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (account ? "Update Account" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}
