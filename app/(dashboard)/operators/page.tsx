import OperatorList from "@/components/operators/OperatorList";
import OperatorForm from "@/components/operators/OperatorForm";
import { getOperators } from "@/lib/actions/operator.actions";

export default async function OperatorsPage() {
  const operators = await getOperators();

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-144px)] animate-in fade-in duration-500 p-4 lg:p-0">
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <OperatorList initialOperators={operators} />
      </div>

      <div className="w-full lg:w-[400px] shrink-0 min-h-0 h-full overflow-y-auto custom-scrollbar">
        <OperatorForm operators={operators} />
      </div>
    </div>
  );
}
