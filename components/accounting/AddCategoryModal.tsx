"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Tag, Layers, CheckCircle2 } from "lucide-react";
import { createCategory, updateCategory, Category } from "@/lib/actions/accounting.actions";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
}

export default function AddCategoryModal({ isOpen, onClose, onSuccess, category }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Income" as "Income" | "Expense",
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        status: category.status,
      });
    } else {
      setFormData({
        name: "",
        type: "Income",
        status: "Active",
      });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Category name is required.", { duration: 6000 });
      return;
    }

    setIsSubmitting(true);
    try {
      if (category) {
        await updateCategory(category.id, formData);
        toast.success("Category updated successfully");
      } else {
        await createCategory(formData);
        toast.success("Category created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message, { duration: 6000 });
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
              {category ? "Update Category" : "Add Category"}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {category ? "Modify existing category" : "Categorize your transactions"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Tag size={12} className="text-[#3da9d4]" /> Category Name *
            </label>
            <input 
              required
              type="text"
              placeholder="e.g. Sales, Rent, Electricity"
              className="input-primary h-11"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Layers size={12} className="text-[#3da9d4]" /> Category Type *
            </label>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
              {["Income", "Expense"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, type: type as any})}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    formData.type === type 
                      ? (type === "Income" ? "bg-emerald-600 text-white shadow-md" : "bg-rose-600 text-white shadow-md")
                      : "bg-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
            <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-[10px] h-11">
              {["Active", "Inactive"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({...formData, status: status as any})}
                  className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    formData.status === status 
                      ? "bg-white text-[#3da9d4] shadow-sm border border-slate-100" 
                      : "bg-transparent text-slate-400 hover:text-slate-600"
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
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <CheckCircle2 size={18} />
                {category ? "Update Category" : "Create Category"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
