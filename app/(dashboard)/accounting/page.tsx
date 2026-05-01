import AccountingDashboard from "@/components/accounting/AccountingDashboard";
import { getAccounts, getCategories, getEntries } from "@/lib/actions/accounting.actions";

export default async function AccountingPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();
  const entries = await getEntries();

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex flex-col shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Accounting</h1>
        <p className="text-sm text-slate-500">Manage your financial transactions, accounts, and categories.</p>
      </div>

      <AccountingDashboard  
      
        initialAccounts={accounts} 
        initialCategories={categories} 
        initialEntries={entries} 
      />
    </div>
  );
}
