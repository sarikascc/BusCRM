"use client";

import { createElement, useState, useEffect } from "react";
import { Plus, Search, Download, Trash2, Edit2, Eye, ReceiptText } from "lucide-react";
import { Account, deleteAccount, getAccounts } from "@/lib/actions/accounting.actions";
import AddAccountModal from "./AddAccountModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

interface Props {
  initialAccounts: Account[];
}

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

export default function AccountsTab({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const handleViewLedger = (account: Account) => {
    setSelectedAccount(account);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAccount(null);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;

    setIsDeleting(true);
    try {
      await deleteAccount(accountToDelete.id);
      setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete.id));
      toast.success("Account deleted successfully");
      setAccountToDelete(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-white sticky top-0 z-10">
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-hover transition-all shadow-sm"
        >
          <Plus size={18} /> Add Account
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-primary pl-10 w-64 py-2"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-all">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-100"><th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Account Name</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Opening Balance</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total In</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Out</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Current Balance</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredAccounts.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No accounts found.</td></tr>
            ) : (
              filteredAccounts.map((acc) =>
                createElement(
                  "tr",
                  {
                    key: acc.id,
                    className: "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                    onClick: () => handleViewLedger(acc),
                  },
                  [
                    <td key="name" className="px-6 py-4 text-sm text-slate-800 font-bold">
                      <div className="group-hover:text-[#3da9d4] transition-colors text-left flex items-center gap-2">
                        <ReceiptText size={14} className="text-slate-400" /> {acc.name}
                      </div>
                    </td>,
                    <td key="opening" className="px-6 py-4 text-sm text-right text-slate-600">{mounted ? formatCurrency(acc.opening_balance) : `₹${acc.opening_balance}`}</td>,
                    <td key="in" className="px-6 py-4 text-sm text-right text-emerald-600 font-bold">{mounted ? formatCurrency(acc.total_in) : `₹${acc.total_in}`}</td>,
                    <td key="out" className="px-6 py-4 text-sm text-right text-rose-600 font-bold">{mounted ? formatCurrency(acc.total_out) : `₹${acc.total_out}`}</td>,
                    <td key="balance" className="px-6 py-4 text-sm text-right font-black text-[#3da9d4]">{mounted ? formatCurrency(acc.current_balance) : `₹${acc.current_balance}`}</td>,
                    <td key="status" className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${acc.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                        }`}>
                        {acc.status}
                      </span>
                    </td>,
                    <td key="actions" className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(acc); }} className="p-1.5 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setAccountToDelete(acc); }} className="p-1.5 text-rose-400 hover:bg-rose-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>,
                  ]
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddAccountModal
          isOpen={isModalOpen}
          account={selectedAccount}
          isViewOnly={viewMode}
          onClose={() => setIsModalOpen(false)}
          onSuccess={async () => {
            const updated = await getAccounts();
            setAccounts(updated);
            setIsModalOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(accountToDelete)}
        title="Delete Account"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="font-bold text-slate-700">{accountToDelete?.name}</strong>?
            Entries must be cleared first.
          </>
        }
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
        onCancel={() => setAccountToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
