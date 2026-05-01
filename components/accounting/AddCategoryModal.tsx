"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createCategory } from "@/lib/actions/accounting.actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCategoryModal({ isOpen, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Income" as "Income" | "Expense",
    status: "Active" as "Active" | "Inactive",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCategory(formData);
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
        <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Add Category</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category Name *</label>
            <input 
              required
              type="text"
              placeholder="e.g. Sales, Rent, Electricity"
              className="input-primary"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category Type *</label>
            <div className="flex gap-2">
              {["Income", "Expense"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, type: type as any})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${
                    formData.type === type 
                      ? (type === "Income" ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600")
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <div className="flex gap-2">
              {["Active", "Inactive"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({...formData, status: status as any})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${
                    formData.status === status 
                      ? "bg-slate-800 text-white border-slate-800" 
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
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
            className="w-full py-3.5 bg-brand text-white rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:bg-brand-hover transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Create Category"}
          </button>
        </form>
      </div>
    </div>
  );
}
