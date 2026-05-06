import OperatorList from "@/components/operators/OperatorList";
import { getOperators } from "@/lib/actions/operator.actions";

import { getAccounts } from "@/lib/actions/accounting.actions";

export default async function OperatorsPage() {
  const [operators, accounts] = await Promise.all([
    getOperators(),
    getAccounts()
  ]);

  return (
    <div className="h-[calc(100vh-144px)] animate-in fade-in duration-500 p-4 lg:p-0">
      <OperatorList initialOperators={operators} accounts={accounts} />
      
    </div>
  );
}
