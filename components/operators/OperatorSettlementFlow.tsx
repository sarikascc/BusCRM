"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Search, 
  Ticket, 
  Calculator, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Banknote,
  Percent,
  Receipt
} from "lucide-react";
import { getOperators } from "@/lib/actions/operator.actions";
import { getUnsettledTickets, processSettlement } from "@/lib/actions/operator-settlement.actions";
import { getAccounts } from "@/lib/actions/accounting.actions";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function OperatorSettlementFlow() {
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get("id");

  const [operators, setOperators] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [unsettledTickets, setUnsettledTickets] = useState<any[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment Form
  const [accountId, setAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Bank Transfer">("Cash");
  const [receivedBy, setReceivedBy] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const [ops, accs] = await Promise.all([getOperators(), getAccounts()]);
    setOperators(ops);
    setAccounts(accs);
    if (preSelectedId) {
      setSelectedOperatorId(preSelectedId);
    }
  }

  useEffect(() => {
    if (selectedOperatorId) {
      fetchTickets(selectedOperatorId);
    } else {
      setUnsettledTickets([]);
      setSelectedTicketIds([]);
    }
  }, [selectedOperatorId]);

  async function fetchTickets(opId: string) {
    setIsLoading(true);
    const tickets = await getUnsettledTickets(opId);
    setUnsettledTickets(tickets);
    // Auto-select all tickets by default
    setSelectedTicketIds(tickets.map((t: any) => t.id));
    setIsLoading(false);
  }

  const selectedOperator = operators.find(op => op.id === selectedOperatorId);
  const commissionPercentage = selectedOperator?.commission_percentage || 0;

  const totalAmount = unsettledTickets
    .filter(t => selectedTicketIds.includes(t.id))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const commissionAmount = (totalAmount * commissionPercentage) / 100;
  const payableAmount = totalAmount - commissionAmount;

  const handleToggleTicket = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTicketIds.length === unsettledTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(unsettledTickets.map(t => t.id));
    }
  };

  const handleSettle = async () => {
    if (!selectedOperatorId || selectedTicketIds.length === 0 || !accountId) {
      toast.error("Please select operator, tickets and payment account.");
      return;
    }

    setIsProcessing(true);
    try {
      await processSettlement({
        operator_id: selectedOperatorId,
        ticket_ids: selectedTicketIds,
        total_amount: totalAmount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        payable_amount: payableAmount,
        paid_amount: payableAmount, // For now, assume full payment
        payment_method: paymentMethod,
        account_id: accountId,
        received_by: receivedBy,
        receiver_mobile: receiverMobile,
        reference_number: referenceNumber,
      });

      toast.success("Settlement processed successfully!");
      // Reset
      setSelectedOperatorId("");
      setAccountId("");
      setReferenceNumber("");
      setPaymentMethod("Cash");
      setReceivedBy("");
      setReceiverMobile("");
    } catch (error: any) {
      toast.error(error.message || "Failed to process settlement");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-1  h-full overflow-hidden">
      
      {/* Step 1: Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="md:col-span-1 saas-card bg-white p-5 border-t-4 border-t-[#3da9d4]">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Select Operator
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="input-primary w-full pl-10 py-2.5 text-sm appearance-none bg-white font-bold"
            >
              <option value="">-- Choose Operator --</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>{op.operator_name}</option>
              ))}
            </select>
          </div>
          
          {selectedOperator && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Commission Rate</span>
              <span className="text-lg font-black text-[#3da9d4]">{selectedOperator.commission_percentage}%</span>
            </div>
          )}
        </div>

        {/* Calculation Summary */}
        <div className="md:col-span-2 saas-card bg-white p-5 border-t-4 border-t-emerald-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Sales</span>
              <span className="text-xl font-black text-slate-800">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-1 text-right md:text-left">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Comm. %</span>
              <span className="text-xl font-black text-[#3da9d4]">{commissionPercentage}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Comm. Amount</span>
              <span className="text-xl font-black text-emerald-600">₹{commissionAmount.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Payable</span>
              <span className="text-2xl font-black text-rose-600">₹{payableAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex  grid-cols-1 md:grid-cols-2 gap-6 min-h-0 overflow-hidden">
        
        {/* Tickets List */}
        <div className="flex-1 saas-card bg-white flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#3da9d4]" />
              <h3 className="font-bold text-slate-700">Unsettled Tickets</h3>
              <span className="bg-[#3da9d4]/10 text-[#3da9d4] px-2 py-0.5 rounded-full text-xs font-bold">
                {selectedTicketIds.length} / {unsettledTickets.length}
              </span>
            </div>
            {unsettledTickets.length > 0 && (
              <button 
                onClick={handleSelectAll}
                className="text-xs font-bold text-[#3da9d4] hover:underline"
              >
                {selectedTicketIds.length === unsettledTickets.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Fetching tickets...</p>
              </div>
            ) : unsettledTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                <AlertCircle className="w-12 h-12 text-slate-200" />
                <p className="text-sm font-medium">
                  {selectedOperatorId ? "No unsettled tickets found for this operator." : "Please select an operator to see tickets."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {unsettledTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => handleToggleTicket(ticket.id)}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedTicketIds.includes(ticket.id) ? "bg-emerald-50/30" : ""}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedTicketIds.includes(ticket.id) ? "bg-emerald-500 border-emerald-500" : "border-slate-200"}`}>
                      {selectedTicketIds.includes(ticket.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{ticket.passenger_name}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ticket.mobile_number}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(ticket.journey_date).toLocaleDateString("en-GB")}
                        </span>
                        <span className="text-[10px] text-slate-400">{ticket.pickup_time.slice(0, 5)}</span>
                      </div>
                      <div className="hidden md:flex flex-col">
                        <span className="text-xs font-medium text-slate-500">{ticket.seat_numbers}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{ticket.travel_type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-[#3da9d4]">₹{ticket.amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment and Confirmation */}
        <div className="w-full md:w-130 saas-card bg-white p-5 flex flex-col gap-5 border-t-4 border-t-rose-500 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-700">Settlement Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Payment Account *
              </label>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-primary w-full pl-10 py-2 text-sm appearance-none bg-white font-bold"
                >
                  <option value="">-- Choose Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Cash", "UPI", "Bank Transfer"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m as any)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${paymentMethod === m ? "bg-rose-500 text-white border-rose-500" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Received By (Name) *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Person receiving money"
                  className="input-primary w-full pl-10 py-2 text-sm bg-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Receiver Mobile *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="tel"
                  value={receiverMobile}

                  onChange={(e) => setReceiverMobile(e.target.value)}
                  placeholder="Mobile number"
                  className="input-primary w-full pl-10 py-2 text-sm bg-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Ref Number / Remarks
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Transaction ID"
                className="input-primary w-full py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">Total Payable</span>
              <span className="text-xl font-black text-rose-600">₹{payableAmount.toLocaleString()}</span>
            </div>

            <button
              disabled={isProcessing || selectedTicketIds.length === 0 || !accountId}
              onClick={handleSettle}
              className="btn-brand w-full py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-brand/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Banknote className="w-4 h-4" /> Settle & Pay
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
