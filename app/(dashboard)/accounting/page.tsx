import AccountingDashboard from "@/components/accounting/AccountingDashboard";
import { getAccounts, getCategories, getEntries } from "@/lib/actions/accounting.actions";

export default async function AccountingPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();
  const entries = await getEntries();

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
    

      <AccountingDashboard  
      
        initialAccounts={accounts} 
        initialCategories={categories} 
        initialEntries={entries} 
      />
    </div>
  );
}
