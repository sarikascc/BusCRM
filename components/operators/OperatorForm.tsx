"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Phone, Percent, ShieldCheck, Plus, X } from "lucide-react";
import { Operator, createOperator, updateOperator } from "@/lib/actions/operator.actions";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";

interface Props {
  operators?: Operator[];
}

export default function OperatorForm({ operators = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    operator_name: "",
    person_name: "",
    mobile_number: "",
    commission_percentage: "0",
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    if (editId && operators.length > 0) {
      const op = operators.find((o) => o.id === editId);
      if (op) {
        setFormData({
          operator_name: op.operator_name,
          person_name: op.person_name,
          mobile_number: op.mobile_number,
          commission_percentage: op.commission_percentage.toString(),
          status: op.status,
        });
      }
    } else {
      setFormData({
        operator_name: "",
        person_name: "",
        mobile_number: "",
        commission_percentage: "0",
        status: "Active",
      });
    }
  }, [editId, operators]);

  const clearForm = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    router.push(`?${params.toString()}`);
  };

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

      if (editId) {
        await updateOperator(editId, data);
        toast.success("Operator updated successfully");
      } else {
        await createOperator(data);
        toast.success("Operator created successfully");
      }
      
      setFormData({
        operator_name: "",
        person_name: "",
        mobile_number: "",
        commission_percentage: "0",
        status: "Active",
      });
      
      if (editId) clearForm();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-dashboard-border shadow-saas h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            {editId ? "Update Operator" : "New Operator"}
          </h3>
          {editId && (
            <button onClick={clearForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          {editId ? "MODIFY EXISTING OPERATOR DETAILS" : "REGISTER A NEW BUS OPERATOR"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
            Operator Name *
          </label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              required
              type="text"
              placeholder="e.g. Mahasagar Travels"
              className="input-primary pl-9 h-10 rounded-lg font-bold text-sm"
              value={formData.operator_name}
              onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
            Contact Person *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              required
              type="text"
              placeholder="Full Name"
              className="input-primary pl-9 h-10 rounded-lg font-bold text-sm"
              value={formData.person_name}
              onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
            Mobile Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              required
              type="tel"
              placeholder="+91 12345 67890"
              className="input-primary pl-9 h-10 rounded-lg font-bold text-sm"
              value={formData.mobile_number}
              maxLength={10}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
            Commission (%)
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="number"
              step="0.01"
              className="input-primary pl-9 h-10 rounded-lg font-bold text-sm text-emerald-600"
              value={formData.commission_percentage}
              onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
            Status
          </label>
          <div className="flex gap-2">
            {["Active", "Inactive"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status: status as any })}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                  formData.status === status
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#3da9d4] text-white rounded-lg font-bold text-sm shadow-lg shadow-[#3da9d4]/20 hover:bg-[#2882a8] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Plus size={18} />
                {editId ? "Update Operator" : "Save Operator"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
