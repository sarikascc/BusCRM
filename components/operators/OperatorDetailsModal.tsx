"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Banknote,
  Receipt,
  Eye,
  History,
  Bus,
  RefreshCw
} from "lucide-react";
import {
  getOperatorSettlements,
  getUnsettledTickets,
  processSettlement,
  getAllOperatorTickets
} from "@/lib/actions/operator-settlement.actions";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operator: any;
  accounts?: any[];
}

export default function OperatorDetailsModal({ isOpen, onClose, operator, accounts = [] }: Props) {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'history'>('bookings');
  const [unsettledTickets, setUnsettledTickets] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isSettling, setIsSettling] = useState(false);
  const [isSettlementFormOpen, setIsSettlementFormOpen] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    accountId: "",
    paymentMethod: "Cash" as "Cash" | "UPI" | "Bank Transfer",
    receivedBy: "",
    receiverMobile: "",
    referenceNumber: "",
    paidAmount: "",
  });

  useEffect(() => {
    if (isOpen && operator) {
      fetchData();
    }
  }, [isOpen, operator]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [settlementData, allTicketsData] = await Promise.all([
        getOperatorSettlements(operator.id),
        getAllOperatorTickets(operator.id)
      ]);
      setSettlements(settlementData);
      setAllTickets(allTicketsData);
      setUnsettledTickets(allTicketsData.filter((t: any) => !t.settlement_id));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSettle = async () => {
    if (selectedTicketIds.length === 0) return;

    const selectedTickets = unsettledTickets.filter(t => selectedTicketIds.includes(t.id));
    const totalAmount = selectedTickets.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const commissionPercentage = Number(operator.commission_percentage) || 0;
    const commissionAmount = (totalAmount * commissionPercentage) / 100;
    const payableAmount = totalAmount - commissionAmount;

    setSettlementForm(prev => ({
      ...prev,
      paidAmount: payableAmount.toString()
    }));
    setIsSettlementFormOpen(true);
  };

  const handleProcessSettlementSubmit = async () => {
    if (!settlementForm.receiverMobile) {
      toast.error("Please fill  receiver details");
      return;
    }

    setIsSettling(true);
    try {
      const selectedTickets = unsettledTickets.filter(t => selectedTicketIds.includes(t.id));
      const totalAmount = selectedTickets.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const commissionPercentage = Number(operator.commission_percentage) || 0;
      const commissionAmount = (totalAmount * commissionPercentage) / 100;
      const payableAmount = totalAmount - commissionAmount;

      await processSettlement({
        operator_id: operator.id,
        ticket_ids: selectedTicketIds,
        total_amount: totalAmount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        payable_amount: payableAmount,
        paid_amount: parseFloat(settlementForm.paidAmount) || 0,
        payment_method: settlementForm.paymentMethod,
        account_id: settlementForm.accountId,
        received_by: settlementForm.receivedBy,
        receiver_mobile: settlementForm.receiverMobile,
        reference_number: settlementForm.referenceNumber,
      });

      toast.success("Settlement processed successfully");
      setIsSettlementFormOpen(false);
      setSelectedTicketIds([]);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error("Failed to process settlement");
    } finally {
      setIsSettling(false);
    }
  };

  if (!isOpen || !operator) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand font-black text-xl shadow-sm border border-brand/5">
              {operator.operator_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{operator.operator_name}</h3>
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="p-1.5 text-slate-400 hover:text-[#3da9d4] hover:bg-[#3da9d4]/5 rounded-lg transition-all"
                  title="Refresh Data"
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <User size={14} className="text-slate-400" /> {operator.person_name}
                </span>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Phone size={14} className="text-slate-400" /> {operator.mobile_number}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {/* Business Overview Row */}
            <div className="p-4 pb-0">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Overview</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50/30 p-3 rounded-[12px] border border-slate-100 group hover:border-[#3da9d4]/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commission</span>
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <DollarSign size={14} className="text-[#3da9d4]" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#3da9d4] tracking-tight">{operator.commission_percentage}%</div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-[12px] border border-slate-100 group hover:border-[#3da9d4]/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlements</span>
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Receipt size={14} className="text-[#3da9d4]" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-800 tracking-tight">{settlements.length}</div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-[12px] border border-slate-100 group hover:border-emerald-200 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Banknote size={14} className="text-emerald-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 tracking-tight">
                    ₹{settlements.reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-[12px] border border-slate-100 group hover:border-amber-200 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unsettled Amount</span>
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Clock size={14} className="text-amber-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-600 tracking-tight">
                    ₹{allTickets.filter(t => !t.settlement_id).reduce((sum, t) => sum + (Number(t.amount) || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between  mb-1  p-4">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => setActiveTab("bookings")}
                  className={`text-sm font-black transition-all uppercase tracking-wider  relative py-4 flex items-center gap-2 ${activeTab === "bookings" ? "text-[#3da9d4]" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  <Bus size={16} />
                  All Bookings
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "bookings" ? "bg-[#3da9d4]/10 text-[#3da9d4]" : "bg-slate-100 text-slate-500"
                    }`}>
                    {allTickets.length}
                  </span>
                  {activeTab === "bookings" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3da9d4] rounded-t-full shadow-[0_-2px_10px_rgba(61,169,212,0.4)]" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`text-sm font-black transition-all uppercase tracking-wider  relative py-4 flex items-center gap-2 ${activeTab === "history" ? "text-[#3da9d4]" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  <Clock size={16} />
                  Settlement History
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "history" ? "bg-[#3da9d4]/10 text-[#3da9d4]" : "bg-slate-100 text-slate-500"
                    }`}>
                    {settlements.length}
                  </span>
                  {activeTab === "history" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3da9d4] rounded-t-full shadow-[0_-2px_10px_rgba(61,169,212,0.4)]" />
                  )}
                </button>
              </div>
              {isLoading && <Loader2 size={18} className="text-[#3da9d4] animate-spin" />}
              <div className="flex items-center gap-4">
                {selectedTicketIds.length > 0 && activeTab === "bookings" && (
                  <div className="flex items-center gap-3">

                    <button
                      onClick={handleSettle}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                    >
                      <Banknote size={18} /> Settle Selected
                    </button>
                  </div>
                )}
              </div>
            </div>


            {activeTab === "bookings" ? (
              allTickets.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Bus size={24} className="text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No bookings yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-4 py-3 w-10 flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={allTickets.filter(t => !t.settlement_id).length > 0 && allTickets.filter(t => !t.settlement_id).every(t => selectedTicketIds.includes(t.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTicketIds(allTickets.filter(t => !t.settlement_id).map(t => t.id));
                              } else {
                                setSelectedTicketIds([]);
                              }
                            }}
                          />
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                           ({selectedTicketIds.length})
                          </span>
                        </th>
                        <th className="px-4 py-3">Passenger</th>
                        <th className="px-4 py-3">Route & Date</th>
                        <th className="px-4 py-3">Booking Account</th>
                        <th className="px-4 py-3 ">Amount</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedTicketIds.includes(ticket.id) ? "bg-emerald-50/30" : ""}`}
                          onClick={() => {
                            if (!ticket.settlement_id) {
                              setSelectedTicketIds(prev => prev.includes(ticket.id) ? prev.filter(id => id !== ticket.id) : [...prev, ticket.id]);
                            }
                          }}
                        >
                          <td className="px-4 py-4 " onClick={e => e.stopPropagation()}>
                            {!ticket.settlement_id && (
                              <input
                                type="checkbox"
                                checked={selectedTicketIds.includes(ticket.id)}
                                onChange={() => setSelectedTicketIds(prev => prev.includes(ticket.id) ? prev.filter(id => id !== ticket.id) : [...prev, ticket.id])}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[11px] font-bold text-slate-800 tracking-wider">{ticket.passenger_name}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{ticket.mobile_number || "N/A"}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider"> TKT NO : {ticket.ticket_number || "NO-TKT"}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1">
                              <span>{ticket.pickup_city?.name}</span>
                              <ArrowRight size={10} className="text-slate-400" />
                              <span>{ticket.drop_city?.name}</span>
                            </div>
                            <p className="text-[11px] font-bold text-[#3da9d4] uppercase tracking-tighter">
                              {new Date(ticket.journey_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
                                <Briefcase size={12} />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-slate-600">{ticket.account?.name || "Cash"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[11px] font-bold text-slate-600  tracking-tighter">₹{Number(ticket.amount || 0).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-md tracking-wider border ${ticket.settlement_id ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                              {ticket.settlement_id ? 'Settled' : 'Unsettled'}
                            </span>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              settlements.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Banknote size={24} className="text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No settlements yet</p>
                  <p className="text-xs text-slate-400 mt-1 text-center">Once you process payments, they will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Settlement Info</th>
                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Receiver Details</th>
                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 text-center">Sales & Commission</th>
                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 text-right">Amount</th>
                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {settlements.map((settlement) => (
                        <tr key={settlement.id} className="hover:bg-slate-50/50 transition-colors group">

                          {/* Info Column */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black text-[#3da9d4] uppercase tracking-tighter">
                                #{settlement.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                              <Calendar size={12} className="text-slate-400" />
                              {new Date(settlement.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>

                          {/* Receiver Column */}
                          <td className="py-4 px-6">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <User size={12} className="text-slate-400" />
                                <span className="text-xs font-black text-slate-700">{settlement.received_by || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={12} className="text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-500">{settlement.receiver_mobile || "N/A"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Sales Column */}
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sales</span>
                                <span className="text-xs font-black text-slate-800">₹{settlement.total_amount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Comm ({settlement.commission_percentage}%)</span>
                                <span className="text-xs font-black text-rose-500">-₹{settlement.commission_amount.toLocaleString()}</span>
                              </div>
                            </div>
                          </td>

                          {/* Paid Amount Column */}
                          <td className="py-4 px-6 text-right">
                            <div className="text-base font-black text-emerald-600 tracking-tight">
                              ₹{settlement.paid_amount.toLocaleString()}
                            </div>
                            <span className="inline-block mt-1 text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                              {settlement.payment_method}
                            </span>
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex flex-col items-end gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                <CheckCircle2 size={10} /> SETTLED
                              </span>
                              {/* <button className="text-[10px] font-bold text-[#3da9d4]  flex items-center gap-1 transition-colors ">
                                <Receipt size={12} /> View Receipt
                              </button> */}
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">

          <button
            onClick={onClose}
            className="px-8 py-3 bg-white text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
          >
            Close Details
          </button>
        </div>

        {/* Settlement Form Overlay */}
        {isSettlementFormOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col max-h-[90vh]">

              {/* Form Header */}
              <div className="p-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-[15px] flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-800">Operator Settlement</h3>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{selectedTicketIds.length} TICKETS SELECTED</p>
                  </div>
                </div>
                <button onClick={() => setIsSettlementFormOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left Side: Summary & Selection Info */}
                <div className="w-full lg:w-100 bg-slate-50/50 p-5 border-r border-slate-100 overflow-y-auto custom-scrollbar">
                  <div className="space-y-5">
                    {/* Operator Name Card */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">OPERATOR</p>
                      <h4 className="text-2xl font-bold text-slate-900 tracking-wider">{operator.operator_name}</h4>
                    </div>

                    {/* Financial Summary Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">TOTAL SALES</p>
                        <p className="text-lg font-black text-slate-900">₹{(unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-[#3da9d4] uppercase tracking-wide mb-1.5 ml-1">COMMISSION</p>
                        <p className="text-lg font-black text-[#3da9d4]">{operator.commission_percentage}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5 ml-1">COMM. AMOUNT</p>
                        <p className="text-lg font-black text-emerald-600">₹{((unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * (Number(operator.commission_percentage) || 0)) / 100).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide mb-1.5 ml-1">PAYABLE</p>
                        <p className="text-lg font-black text-rose-600">₹{(unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) - ((unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * (Number(operator.commission_percentage) || 0)) / 100)).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Mini Ticket List */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">SELECTED TICKETS</p>
                      <div className="space-y-2">
                        {unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).map(ticket => (
                          <div key={ticket.id} className="bg-white p-3 rounded-[11px] border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">{ticket.passenger_name}</p>
                              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{ticket.ticket_number || "NO-TKT"}</p>
                            </div>
                            <p className="text-[11px] font-bold text-emerald-600">₹{ticket.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Payment Form Inputs */}
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                  <div className="space-y-6">


                    {/* Receiver Info Section Header */}
                    <div className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">RECEIVED BY *</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={settlementForm.receivedBy}
                              onChange={(e) => setSettlementForm(prev => ({ ...prev, receivedBy: e.target.value }))}
                              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-[11px] text-sm font-bold focus:ring-4 focus:ring-[#3da9d4]/10 focus:border-[#3da9d4] outline-none transition-all shadow-sm"
                              placeholder="Enter name of person receiving payment"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">RECEIVER MOBILE *</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={settlementForm.receiverMobile}
                              onChange={(e) => setSettlementForm(prev => ({ ...prev, receiverMobile: e.target.value }))}
                              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-[11px] text-sm font-bold focus:ring-4 focus:ring-[#3da9d4]/10 focus:border-[#3da9d4] outline-none transition-all shadow-sm"
                              placeholder="Enter mobile number"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reference and Remarks */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">REFERENCE / REMARKS</label>
                      <input
                        type="text"
                        value={settlementForm.referenceNumber}
                        onChange={(e) => setSettlementForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-[11px] text-sm font-bold focus:ring-4 focus:ring-[#3da9d4]/10 focus:border-[#3da9d4] outline-none transition-all shadow-sm"
                        placeholder="Transaction ID / Remarks"
                      />
                    </div>

                    {/* Payment Amounts */}
                    <div className="pt-2">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide  ml-1">AMOUNT *</label>
                        <div className="w-full h-12 px-4 bg-emerald-50 rounded-[11px] border border-emerald-100 flex items-center">
                          <span className="text-sm font-black text-emerald-600">
                            ₹{(unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) - ((unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * (Number(operator.commission_percentage) || 0)) / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide  ml-1">TOTAL PAYABLE</p>
                  <p className="text-2xl font-black text-rose-600">
                    ₹{(unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) - ((unsettledTickets.filter(t => selectedTicketIds.includes(t.id)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * (Number(operator.commission_percentage) || 0)) / 100)).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    disabled={isSettling}
                    onClick={handleProcessSettlementSubmit}
                    className="h-11 px-10 bg-emerald-600 text-white rounded-[15px] font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSettling ? <Loader2 size={20} className="animate-spin" /> : <Banknote size={20} />}
                    Settle Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
