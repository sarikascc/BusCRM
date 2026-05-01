"use client";

import { useState } from "react";
import EntriesTab from "./EntriesTab";
import AccountsTab from "./AccountsTab";
import CategoriesTab from "./CategoriesTab";
import { Account, Category, Entry } from "@/lib/actions/accounting.actions";

interface Props {
  initialAccounts: Account[];
  initialCategories: Category[];
  initialEntries: Entry[];
}

export default function AccountingDashboard({
  initialAccounts,
  initialCategories,
  initialEntries,
}: Props) {
  const [activeTab, setActiveTab] = useState("entries");

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 pt-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 bg-slate-200/50 rounded-xl w-fit">
            {[
              { id: "entries", label: "Entries" },
              { id: "accounts", label: "Account" },
              { id: "categories", label: "Categories" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-[#3da9d4] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "entries" && (
          <EntriesTab 
            initialEntries={initialEntries} 
            accounts={initialAccounts} 
            categories={initialCategories} 
          />
        )}
        {activeTab === "accounts" && (
          <AccountsTab initialAccounts={initialAccounts} />
        )}
        {activeTab === "categories" && (
          <CategoriesTab initialCategories={initialCategories} />
        )}
      </div>
    </div>
  );
}
