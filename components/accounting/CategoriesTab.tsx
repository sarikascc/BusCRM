"use client";

import { createElement, useState } from "react";
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { Category, deleteCategory, getCategories } from "@/lib/actions/accounting.actions";
import AddCategoryModal from "@/components/accounting/AddCategoryModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

interface Props {
  initialCategories: Category[];
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

export default function CategoriesTab({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      toast.success("Category deleted successfully");
      setCategoryToDelete(null);
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
          <Plus size={18} /> Add Category
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-primary pl-10 w-64 py-2"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-100"><th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category Name</th><th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th><th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th><th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCategories.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No categories found.</td></tr>
            ) : (
              filteredCategories.map((cat) =>
                createElement(
                  "tr",
                  {
                    key: cat.id,
                    className: "hover:bg-slate-50/50 transition-colors group",
                  },
                  [
                    <td key="name" className="px-6 py-4 text-sm text-slate-800 font-bold">{cat.name}</td>,
                    <td key="type" className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        cat.type === "Income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}>
                        {cat.type}
                      </span>
                    </td>,
                    <td key="status" className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        cat.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                      }`}>
                        {cat.status}
                      </span>
                    </td>,
                    <td key="actions" className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2  transition-opacity">
                        <button onClick={() => handleEdit(cat)} className="p-1.5 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => setCategoryToDelete(cat)} className="p-1.5 text-rose-400 hover:bg-rose-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
        <AddCategoryModal
          isOpen={isModalOpen}
          category={selectedCategory}
          onClose={() => setIsModalOpen(false)}
          onSuccess={async () => {
            const updated = await getCategories();
            setCategories(updated);
            setIsModalOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong className="font-bold text-slate-700">{categoryToDelete?.name}</strong>?
            It must not be linked to any entries.
          </>
        }
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
