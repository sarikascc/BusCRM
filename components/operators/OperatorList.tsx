"use client";

import { useEffect, useState } from "react";
import { Search, User, Edit2, Trash2, ChevronLeft, ChevronRight, RefreshCw, Wallet } from "lucide-react";
import { Operator, deleteOperator } from "@/lib/actions/operator.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import OperatorModal from "./OperatorModal";
import OperatorDetailsModal from "./OperatorDetailsModal";
import { Plus, Eye } from "lucide-react";

interface Props {
  initialOperators: Operator[];
  accounts?: any[];
}

export default function OperatorList({ initialOperators, accounts = [] }: Props) {
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsOperator, setDetailsOperator] = useState<Operator | null>(null);
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

  const handleEdit = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedOperator(null);
    setIsModalOpen(true);
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

  const handleViewDetails = (operator: Operator) => {
    setDetailsOperator(operator);
    setIsDetailsOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] overflow-hidden relative shadow-sm">
      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search operator name, contact or mobile..."
            className="input-primary pl-9 py-2 text-sm w-full bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-[#3da9d4] hover:border-[#3da9d4]/30 hover:bg-[#3da9d4]/5 transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3da9d4] text-white rounded-xl text-sm font-bold hover:bg-[#2882a8] transition-all shadow-lg shadow-[#3da9d4]/20"
          >
            <Plus size={18} /> Add Operator
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        {currentOperators.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-500">No operators found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or add a new operator</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <th className="px-6 py-4 font-bold whitespace-nowrap">Operator Name</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">Contact Person</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">Mobile Number</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">Commission</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentOperators.map((operator) => (
                <tr
                  key={operator.id}
                  onClick={() => handleViewDetails(operator)}
                  className="hover:bg-[#3da9d4]/5 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3da9d4]/20 to-[#3da9d4]/5 flex items-center justify-center text-[#3da9d4] font-bold shrink-0 text-xs shadow-sm">
                        {operator.operator_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800 text-sm">
                        {operator.operator_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-700 font-semibold">{operator.person_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600 font-bold tracking-wide">{operator.mobile_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 shadow-sm">
                      {operator.commission_percentage}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest border shadow-sm inline-block ${operator.status === "Active"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                    >
                      {operator.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2  transition-all duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(operator);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                        title="Settle Payments"
                      >
                        <Wallet size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(operator);
                        }}
                        className="p-2 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-lg transition-colors border border-transparent hover:border-[#3da9d4]/20"
                        title="Edit Operator"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOperatorToDelete(operator);
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        title="Delete Operator"
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
      <div className="py-3 px-6 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
          Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{Math.max(1, totalPages)}</strong>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <OperatorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOperator(null);
        }}
        operator={selectedOperator}
      />

      <OperatorDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setDetailsOperator(null);
        }}
        operator={detailsOperator}
        accounts={accounts}
      />

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
