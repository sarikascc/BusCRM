"use client";

import { useEffect, useState } from "react";
import { Search, User, Edit2, Trash2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Operator, deleteOperator } from "@/lib/actions/operator.actions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  initialOperators: Operator[];
}

export default function OperatorList({ initialOperators }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setOperators(initialOperators);
  }, [initialOperators]);

  const filteredOperators = operators.filter(
    (op) =>
      op.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.mobile_number.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOperators = filteredOperators.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleEdit = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    router.push(`?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!operatorToDelete) return;

    setIsDeleting(true);
    try {
      await deleteOperator(operatorToDelete.id);
      setOperators((currentOperators) =>
        currentOperators.filter((op) => op.id !== operatorToDelete.id)
      );
      toast.success("Operator deleted successfully");
      setOperatorToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete operator");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] overflow-hidden relative">
    
      

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex gap-3 items-center bg-slate-50/50 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name/mobile..."
            className="input-primary pl-9 py-2 text-sm w-full bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={resetFilters}
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-[#3da9d4] hover:border-[#3da9d4]/30 hover:bg-[#3da9d4]/5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        {currentOperators.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <User className="w-12 h-12 mb-3 text-slate-200" />
            <p className="text-sm font-medium">No operators found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
                <th className="px-4 py-4 font-bold whitespace-nowrap">Operator Name</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Contact Person</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Mobile Number</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Commission</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Status</th>
                <th className="px-4 py-4 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentOperators.map((operator) => (
                <tr key={operator.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#3da9d4]/10 flex items-center justify-center text-[#3da9d4] font-bold shrink-0 text-xs">
                        {operator.operator_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800 text-sm">
                        {operator.operator_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-slate-700 font-medium">{operator.person_name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-slate-600 font-medium">{operator.mobile_number}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-bold text-emerald-600">
                      {operator.commission_percentage}%
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide border shadow-sm inline-block ${
                        operator.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-100"
                      }`}
                    >
                      {operator.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(operator.id)}
                        className="p-1.5 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setOperatorToDelete(operator)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="py-2 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
        <span className="text-sm text-slate-500 font-medium">
          Showing <strong className="text-slate-700">{startIndex + 1}</strong> to{" "}
          <strong className="text-slate-700">
            {Math.min(startIndex + itemsPerPage, filteredOperators.length)}
          </strong>{" "}
          of <strong className="text-slate-700">{filteredOperators.length}</strong> operators
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="px-3 py-1 text-sm font-bold text-[#3da9d4] bg-[#3da9d4]/10 border border-[#3da9d4]/20 rounded-lg">
            {currentPage} / {Math.max(1, totalPages)}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(operatorToDelete)}
        title="Delete Operator"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="font-bold text-slate-700">
              {operatorToDelete?.operator_name}
            </strong>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
        onCancel={() => setOperatorToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
