"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Phone, Percent, ShieldCheck, Plus, X, CheckCircle2 } from "lucide-react";
import { Operator, createOperator, updateOperator } from "@/lib/actions/operator.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operator?: Operator | null;
}

export default function OperatorModal({ isOpen, onClose, operator }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    operator_name: "",
    person_name: "",
    mobile_number: "",
    commission_percentage: "10",
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    if (operator) {
      setFormData({
        operator_name: operator.operator_name,
        person_name: operator.person_name,
        mobile_number: operator.mobile_number,
        commission_percentage: operator.commission_percentage.toString(),
        status: operator.status,
      });
    } else {
      setFormData({
        operator_name: "",
        person_name: "",
        mobile_number: "",
        commission_percentage: "10",
        status: "Active",
      });
    }
  }, [operator, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.operator_name || !formData.person_name || !formData.mobile_number) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        commission_percentage: parseFloat(formData.commission_percentage),
      };

      if (operator) {
        await updateOperator(operator.id, data);
        toast.success("Operator updated successfully");
      } else {
        await createOperator(data);
        toast.success("Operator created successfully");
      }
      
      onClose();
      router.refresh();
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
              {operator ? "Update Operator" : "Add New Operator"}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {operator ? "Modify existing operator details" : "Register a new bus operator"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-[#3da9d4]" /> Operator Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Mahasagar Travels"
              className="input-primary h-11 rounded-xl font-bold text-sm"
              value={formData.operator_name}
              onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <User size={12} className="text-slate-400" /> Contact Person *
              </label>
              <input
                required
                type="text"
                placeholder="Full Name"
                className="input-primary h-11 rounded-xl font-bold text-sm"
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Phone size={12} className="text-slate-400" /> Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+91</span>
                <input
                  required
                  type="tel"
                  placeholder="1234567890"
                  className="input-primary pl-12 h-11 rounded-xl font-bold text-sm tracking-wider"
                  value={formData.mobile_number}
                  maxLength={10}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Percent size={12} className="text-emerald-500" /> Commission
              </label>
              <input
                type="number"
                step="0.01"
                className="input-primary h-11 rounded-xl font-black text-sm text-emerald-600"
                value={formData.commission_percentage}
                onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                Status
              </label>
              <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-xl h-11">
                {["Active", "Inactive"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: status as any })}
                    className={`flex-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      formData.status === status
                        ? "bg-white text-[#3da9d4] shadow-sm border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
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
                {operator ? "Update Operator" : "Create Operator"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
