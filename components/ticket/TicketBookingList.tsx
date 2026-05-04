"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTicketBooking } from "@/lib/actions/ticket.actions";
import { processSettlement } from "@/lib/actions/operator-settlement.actions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TicketBookingModal from "./TicketBookingModal";
import TicketDetailsModal from "./TicketDetailsModal";
import { toast } from "sonner";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Phone,
  Bus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Briefcase,
  CheckCircle2,
  Plus,
  Banknote,
  Wallet,
  Receipt,
  X,
  Loader2,
  DollarSign,
  History,
} from "lucide-react";

interface TicketBooking {
  id: string;
  passenger_name: string;
  mobile_number: string;
  pickup_city_id: string;
  drop_city_id: string;
  ticket_number?: string | null;
  booking_date: string;
  journey_date: string;
  pickup_time: string;
  pickup_city?: { name?: string | null } | null;
  drop_city?: { name?: string | null } | null;
  seat_numbers?: string | null;
  total_seats?: number | null;
  bus_number?: string | null;
  travel_type: "AC" | "Non-AC";
  operator_id?: string | null;
  operator?: {
    operator_name?: string | null;
    mobile_number?: string | null;
    commission_percentage?: number | string | null;
  } | null;
  amount?: number | null;
  payment_type: "Cash" | "UPI";
  settlement_id?: string | null;
  paid_to_operator_name?: string | null;
}

interface Account {
  id: string;
  name: string;
  status?: "Active" | "Inactive" | string;
}

interface OperatorSettlement {
  id: string;
  operator_id: string;
  total_amount: number | string;
  commission_percentage: number | string;
  commission_amount: number | string;
  payable_amount: number | string;
  paid_amount: number | string;
  received_by?: string | null;
  receiver_mobile?: string | null;
  payment_method?: "Cash" | "UPI" | "Bank Transfer" | null;
  reference_number?: string | null;
  settlement_date?: string | null;
  created_at?: string | null;
  operator?: {
    operator_name?: string | null;
    mobile_number?: string | null;
  } | null;
  tickets?: Array<{
    id: string;
    ticket_number?: string | null;
    passenger_name?: string | null;
    mobile_number?: string | null;
    journey_date?: string | null;
    seat_numbers?: string | null;
    total_seats?: number | null;
    amount?: number | string | null;
    payment_type?: string | null;
  }>;
}

export default function TicketBookingList({
  initialTickets = [],
  accounts = [],
  settlements = [],
}: {
  initialTickets: TicketBooking[];
  cities?: { id: string; name: string }[];
  accounts?: Account[];
  settlements?: OperatorSettlement[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [settlementFilter, setSettlementFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketToDelete, setTicketToDelete] = useState<TicketBooking | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketBooking | null>(null);
  const [detailsTicket, setDetailsTicket] = useState<TicketBooking | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    accountId: "",
    paymentMethod: "Cash" as "Cash" | "UPI" | "Bank Transfer",
    receivedBy: "",
    receiverMobile: "",
    referenceNumber: "",
    paidAmount: "",
  });
  const itemsPerPage = 10;

  const operatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    initialTickets.forEach((ticket) => {
      if (ticket.operator_id && ticket.operator?.operator_name) {
        map.set(ticket.operator_id, ticket.operator.operator_name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [initialTickets]);

  const filteredTickets = initialTickets.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (ticket.passenger_name?.toLowerCase() || "").includes(searchLower) ||
      (ticket.mobile_number || "").includes(searchLower) ||
      (ticket.ticket_number?.toLowerCase() || "").includes(searchLower) ||
      (ticket.operator?.operator_name?.toLowerCase() || "").includes(searchLower);

    const matchesSettlement =
      settlementFilter === "all" ||
      (settlementFilter === "settled" && ticket.settlement_id) ||
      (settlementFilter === "unsettled" && !ticket.settlement_id);

    const matchesOperator =
      !operatorFilter || ticket.operator_id === operatorFilter;

    return (
      matchesSearch &&
      matchesSettlement &&
      matchesOperator
    );
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = filteredTickets.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const selectedTickets = initialTickets.filter((ticket) =>
    selectedTicketIds.includes(ticket.id),
  );
  const selectedOperatorIds = Array.from(
    new Set(
      selectedTickets
        .map((ticket) => ticket.operator_id)
        .filter((operatorId): operatorId is string => Boolean(operatorId)),
    ),
  );
  const canSettleSelection =
    selectedTickets.length > 0 && selectedOperatorIds.length === 1;
  const selectedOperator = selectedTickets[0]?.operator;
  const commissionPercentage = canSettleSelection
    ? Number(selectedOperator?.commission_percentage) || 0
    : 0;
  const totalAmount = selectedTickets.reduce(
    (sum, ticket) => sum + (Number(ticket.amount) || 0),
    0,
  );
  const commissionAmount = (totalAmount * commissionPercentage) / 100;
  const payableAmount = totalAmount - commissionAmount;
  const historyTotalPaid = settlements.reduce(
    (sum, settlement) => sum + (Number(settlement.paid_amount) || 0),
    0,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, settlementFilter, operatorFilter]);

  const handleEdit = (ticket: TicketBooking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedTicket(null);
    setIsModalOpen(true);
  };

  const handleRowClick = (ticket: TicketBooking) => {
    setDetailsTicket(ticket);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSettlementFilter("all");
    setOperatorFilter("");
    setSelectedTicketIds([]);
    setCurrentPage(1);
  };

  const handleToggleTicket = (
    ticket: TicketBooking,
    e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation();

    if (ticket.settlement_id) {
      toast.error("This ticket is already settled.");
      return;
    }

    if (!ticket.operator_id) {
      toast.error("Ticket operator is missing.");
      return;
    }

    setSelectedTicketIds((current) => {
      if (current.includes(ticket.id)) {
        return current.filter((id) => id !== ticket.id);
      }

      const existingOperatorId = selectedTickets[0]?.operator_id;
      if (existingOperatorId && existingOperatorId !== ticket.operator_id) {
        toast.error("Please select tickets from one operator at a time.");
        return current;
      }

      return [...current, ticket.id];
    });
  };

  const handleSelectCurrentPage = () => {
    const unsettledTickets = currentTickets.filter(
      (ticket) => !ticket.settlement_id && ticket.operator_id,
    );

    if (unsettledTickets.length === 0) return;

    const operatorIds = Array.from(
      new Set(unsettledTickets.map((ticket) => ticket.operator_id)),
    );

    if (!operatorFilter && operatorIds.length > 1) {
      toast.error("Please filter one operator before selecting all.");
      return;
    }

    const currentIds = unsettledTickets.map((ticket) => ticket.id);
    const allSelected = currentIds.every((id) => selectedTicketIds.includes(id));

    setSelectedTicketIds((current) =>
      allSelected
        ? current.filter((id) => !currentIds.includes(id))
        : Array.from(new Set([...current, ...currentIds])),
    );
  };

  const handleOpenSettlement = () => {
    if (!canSettleSelection) {
      toast.error("Please select unsettled tickets from one operator.");
      return;
    }

    setSettlementForm((current) => ({
      ...current,
      receivedBy: "",
      receiverMobile: "",
      paidAmount: payableAmount.toString(),
    }));
    setIsSettlementOpen(true);
  };

  const handleProcessSettlement = async () => {
    if (!canSettleSelection) {
      toast.error("Please select unsettled tickets from one operator.");
      return;
    }

    if (!settlementForm.accountId || !settlementForm.receivedBy || !settlementForm.receiverMobile) {
      toast.error("Please fill settlement account and receiver details.");
      return;
    }

    setIsSettling(true);
    try {
      await processSettlement({
        operator_id: selectedOperatorIds[0],
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
      setSelectedTicketIds([]);
      setIsSettlementOpen(false);
      setSettlementForm({
        accountId: "",
        paymentMethod: "Cash",
        receivedBy: "",
        receiverMobile: "",
        referenceNumber: "",
        paidAmount: "",
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process settlement");
    } finally {
      setIsSettling(false);
    }
  };

  async function handleDelete(ticket: TicketBooking, e: React.MouseEvent) {
    e.stopPropagation();
    setTicketToDelete(ticket);
  }

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] overflow-hidden relative shadow-sm">
      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-3 items-center bg-slate-50/50 shrink-0">
        <div className="relative w-full xl:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, mobile, ticket or operator..."
            className="input-primary pl-9 py-2 text-sm w-full bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={settlementFilter}
          onChange={(e) => setSettlementFilter(e.target.value)}
          className="input-primary py-2 text-sm w-full xl:w-40 bg-white shadow-sm font-bold"
        >
          <option value="all">All Tickets</option>
          <option value="unsettled">Unsettled</option>
          <option value="settled">Settled</option>
        </select>

        <select
          value={operatorFilter}
          onChange={(e) => {
            setOperatorFilter(e.target.value);
            setSelectedTicketIds([]);
          }}
          className="input-primary py-2 text-sm w-full xl:w-56 bg-white shadow-sm font-bold"
        >
          <option value="">All Operators</option>
          {operatorOptions.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 w-full xl:w-auto">
          <button
            onClick={resetFilters}
            className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-[#3da9d4] hover:border-[#3da9d4]/30 transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenSettlement}
            disabled={!canSettleSelection}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Settle selected tickets"
          >
            <Banknote size={18} /> Settle ({selectedTicketIds.length})
          </button>

          <button
            onClick={handleAddNew}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3da9d4] text-white rounded-xl text-sm font-bold hover:bg-[#2882a8] transition-all shadow-lg shadow-[#3da9d4]/20"
          >
            <Plus size={18} /> Add Booking
          </button>
        </div>
      </div>

      {/* Selected Tickets Summary Card */}
      {selectedTicketIds.length > 0 && (
        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white rounded-2xl border border-[#3da9d4]/20 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3da9d4]/5 rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-[#3da9d4]/10 rounded-xl flex items-center justify-center text-[#3da9d4]">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
                <h4 className="text-lg font-black text-slate-800 leading-tight">
                  {canSettleSelection ? selectedOperator?.operator_name : "Multiple Operators Selected"}
                </h4>
                <p className="text-[10px] font-bold text-[#3da9d4] uppercase mt-0.5">
                  {selectedTicketIds.length} {selectedTicketIds.length > 1 ? 'Tickets' : 'Ticket'} Selected
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 lg:max-w-3xl relative z-10">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                <p className="text-base font-black text-slate-800">Rs. {totalAmount.toLocaleString()}</p>
              </div>
              
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commission</p>
                <p className="text-base font-black text-[#3da9d4]">{commissionPercentage}%</p>
              </div>

              <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Comm. Amount</p>
                <p className="text-base font-black text-emerald-600">Rs. {commissionAmount.toLocaleString()}</p>
              </div>

              <div className="bg-rose-50/30 p-3 rounded-xl border border-rose-100/50">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Payable</p>
                <p className="text-base font-black text-rose-600">Rs. {payableAmount.toLocaleString()}</p>
              </div>
            </div>

            {!canSettleSelection && selectedTicketIds.length > 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center p-4">
                <p className="text-xs font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-full border border-rose-100 shadow-sm flex items-center gap-2">
                  <X size={14} /> Please select tickets from one operator only for settlement
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bus className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-500">No bookings found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or add a new booking</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-4 font-bold w-12">
                  <input
                    type="checkbox"
                    checked={
                      currentTickets.some((ticket) => !ticket.settlement_id && ticket.operator_id) &&
                      currentTickets
                        .filter((ticket) => !ticket.settlement_id && ticket.operator_id)
                        .every((ticket) => selectedTicketIds.includes(ticket.id))
                    }
                    onChange={handleSelectCurrentPage}
                    className="h-4 w-4 rounded border-slate-300 text-[#3da9d4] focus:ring-[#3da9d4]"
                    title="Select visible unsettled tickets"
                  />
                </th>
                <th className="px-6 py-4 font-bold">Ticket Info</th>
                <th className="px-6 py-4 font-bold">Passenger</th>
                <th className="px-6 py-4 font-bold">Route & Pickup</th>
                <th className="px-6 py-4 font-bold">Journey</th>
                <th className="px-6 py-4 font-bold text-center">Seats</th>
                <th className="px-6 py-4 font-bold">Bus & Type</th>
                <th className="px-6 py-4 font-bold">Operator & Payment</th>
                <th className="px-6 py-4 font-bold">Payment Collection</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => handleRowClick(ticket)}
                  className={`hover:bg-[#3da9d4]/5 transition-colors group cursor-pointer ${selectedTicketIds.includes(ticket.id) ? "bg-emerald-50/40" : ""
                    }`}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTicketIds.includes(ticket.id)}
                      disabled={Boolean(ticket.settlement_id)}
                      onChange={(e) => handleToggleTicket(ticket, e)}
                      className="h-4 w-4 rounded border-slate-300 text-[#3da9d4] focus:ring-[#3da9d4] disabled:opacity-40"
                      title={ticket.settlement_id ? "Already settled" : "Select ticket"}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#3da9d4]">
                        {ticket.ticket_number || "NO-TKT"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(ticket.booking_date).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{ticket.passenger_name}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3" /> {ticket.mobile_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-slate-700 font-bold flex items-center gap-1.5">
                        {ticket.pickup_city?.name} <ArrowRight className="w-3 h-3 text-slate-300" /> {ticket.drop_city?.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(ticket.journey_date).toLocaleDateString("en-GB")}
                      </span>
                      <span className="text-xs text-[#3da9d4] font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {ticket.pickup_time.slice(0, 5)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">
                        {ticket.seat_numbers}
                      </span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                        TOTAL SEATS: {ticket.total_seats}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.bus_number || "N/A"}
                      </span>
                      <span className={`text-[10px] w-fit px-2 py-0.5 rounded font-black uppercase tracking-wider border shadow-sm ${ticket.travel_type === 'AC' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {ticket.travel_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#3da9d4]" />
                        {ticket.operator?.operator_name || "N/A"}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <span className="font-black text-emerald-600">₹{ticket.amount || 0}</span>
                        <span className="text-slate-200">|</span>
                        <span className="text-slate-500 font-bold flex items-center gap-1 uppercase text-[10px]">
                          {ticket.payment_type}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.settlement_id ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black w-fit border border-emerald-200 flex items-center gap-1 uppercase tracking-widest shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> SETTLED
                        </span>
                        {ticket.paid_to_operator_name && (
                          <span className="text-[9px] text-slate-500 font-bold mt-1.5 ml-1 flex items-center gap-1">
                            <User size={10} className="text-slate-400" /> {ticket.paid_to_operator_name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black border border-slate-200 uppercase tracking-widest shadow-sm flex items-center gap-1 w-fit">
                        <Clock size={10} className="text-slate-400" /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleEdit(ticket, e)}
                        className="p-2 text-[#3da9d4] hover:text-[#2882a8] hover:bg-[#3da9d4]/5 rounded-xl transition-all border border-transparent hover:border-[#3da9d4]/10 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(ticket, e)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm hover:shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="py-3 px-6 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
          Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{Math.max(1, totalPages)}</strong>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <TicketDetailsModal
        isOpen={Boolean(detailsTicket)}
        booking={detailsTicket}
        onClose={() => setDetailsTicket(null)}
      />

      <TicketBookingModal
        isOpen={isModalOpen}
        booking={selectedTicket}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicket(null);
        }}
        onSuccess={() => router.refresh()}
      />

      {isSettlementOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Operator Settlement</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {selectedTickets.length} tickets selected
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettlementOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    Operator
                  </div>
                  <div className="mt-1 text-lg font-black text-slate-800">
                    {selectedOperator?.operator_name || "Selected Operator"}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Total Sales</div>
                      <div className="text-base font-black text-slate-800">Rs. {totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Commission</div>
                      <div className="text-base font-black text-[#3da9d4]">{commissionPercentage}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Comm. Amount</div>
                      <div className="text-base font-black text-emerald-600">Rs. {commissionAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Payable</div>
                      <div className="text-base font-black text-rose-600">Rs. {payableAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-100 custom-scrollbar">
                  {selectedTickets.map((ticket) => (
                    <div key={ticket.id} className="px-4 py-3 border-b border-slate-50 last:border-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{ticket.passenger_name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          {ticket.ticket_number || "NO-TKT"} | {ticket.seat_numbers}
                        </div>
                      </div>
                      <div className="text-sm font-black text-emerald-600">
                        Rs. {Number(ticket.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Payment Account *
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={settlementForm.accountId}
                      onChange={(e) =>
                        setSettlementForm((current) => ({ ...current, accountId: e.target.value }))
                      }
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 appearance-none bg-white font-bold"
                    >
                      <option value="">Select Account</option>
                      {accounts
                        .filter((account) => account.status !== "Inactive")
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Cash", "UPI", "Bank Transfer"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() =>
                          setSettlementForm((current) => ({ ...current, paymentMethod: method }))
                        }
                        className={`h-10 rounded-lg border text-[11px] font-black transition-all ${settlementForm.paymentMethod === method
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 mt-2">
                  <p className="text-[10px] font-black text-[#3da9d4] uppercase tracking-[0.2em] mb-4">Manual Receiver Details</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                        Received By *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={settlementForm.receivedBy}
                          onChange={(e) =>
                            setSettlementForm((current) => ({ ...current, receivedBy: e.target.value }))
                          }
                          className="input-primary w-full text-sm h-11 rounded-xl pl-10 font-bold bg-white border-slate-200 focus:border-[#3da9d4] focus:ring-4 focus:ring-[#3da9d4]/5 transition-all"
                          placeholder="Enter name of person receiving payment"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                        Receiver Mobile *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={settlementForm.receiverMobile}
                          onChange={(e) =>
                            setSettlementForm((current) => ({ ...current, receiverMobile: e.target.value }))
                          }
                          className="input-primary w-full text-sm h-11 rounded-xl pl-10 font-bold bg-white border-slate-200 focus:border-[#3da9d4] focus:ring-4 focus:ring-[#3da9d4]/5 transition-all"
                          placeholder="Enter mobile number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Reference / Remarks
                  </label>
                  <input
                    type="text"
                    value={settlementForm.referenceNumber}
                    onChange={(e) =>
                      setSettlementForm((current) => ({ ...current, referenceNumber: e.target.value }))
                    }
                    className="input-primary w-full text-sm h-10 rounded-lg font-bold"
                    placeholder="Transaction ID"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                        Paid Amount *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          required
                          value={settlementForm.paidAmount}
                          onChange={(e) =>
                            setSettlementForm((current) => ({ ...current, paidAmount: e.target.value }))
                          }
                          className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold bg-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                        Pending Amount
                      </label>
                      <div className="h-10 px-4 flex items-center bg-slate-50 rounded-lg border border-slate-100 text-sm font-black text-rose-600">
                        Rs. {(payableAmount - (parseFloat(settlementForm.paidAmount) || 0)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Payable</div>
                <div className="text-xl font-black text-rose-600">Rs. {payableAmount.toLocaleString()}</div>
              </div>
              <button
                onClick={handleProcessSettlement}
                disabled={isSettling}
                className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {isSettling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4" />
                )}
                Settle Now
              </button>
            </div>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[88vh]">
            <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#3da9d4]/10 text-[#3da9d4] flex items-center justify-center">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Settlement History</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {settlements.length} settlements | Rs. {historyTotalPaid.toLocaleString()} paid
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-slate-50/40">
              {settlements.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Receipt className="w-12 h-12 text-slate-200" />
                  <p className="text-sm font-bold text-slate-500">No settlement history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settlements.map((settlement) => (
                    <div key={settlement.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-slate-800">
                              {settlement.operator?.operator_name || "Operator"}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-100">
                              Settled
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {new Date(settlement.settlement_date || settlement.created_at || "").toLocaleString("en-GB")}
                            {settlement.reference_number ? ` | Ref: ${settlement.reference_number}` : ""}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-full lg:min-w-[520px]">
                          <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase">Sales</div>
                            <div className="text-sm font-black text-slate-800">Rs. {Number(settlement.total_amount || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase">Commission</div>
                            <div className="text-sm font-black text-[#3da9d4]">Rs. {Number(settlement.commission_amount || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase">Payable</div>
                            <div className="text-sm font-black text-rose-600">Rs. {Number(settlement.payable_amount || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase">Paid</div>
                            <div className="text-sm font-black text-emerald-600">Rs. {Number(settlement.paid_amount || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-b border-slate-50 bg-slate-50/40">
                        <div className="font-bold text-slate-600">
                          Receiver: <span className="text-slate-800">{settlement.received_by || "N/A"}</span>
                        </div>
                        <div className="font-bold text-slate-600">
                          Mobile: <span className="text-slate-800">{settlement.receiver_mobile || "N/A"}</span>
                        </div>
                        <div className="font-bold text-slate-600">
                          Method: <span className="text-slate-800">{settlement.payment_method || "N/A"}</span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-50">
                        {(settlement.tickets || []).map((ticket) => (
                          <div key={ticket.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-bold text-slate-800">
                                {ticket.passenger_name || "Passenger"}
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {ticket.ticket_number || "NO-TKT"} | {ticket.seat_numbers || "N/A"} | {ticket.total_seats || 0} seats
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500">
                                {ticket.journey_date ? new Date(ticket.journey_date).toLocaleDateString("en-GB") : "N/A"}
                              </span>
                              <span className="text-sm font-black text-emerald-600">
                                Rs. {Number(ticket.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(ticketToDelete)}
        title="Delete Booking"
        description={
          <>
            Are you sure you want to delete booking{" "}
            <strong className="font-bold text-slate-700">
              {ticketToDelete?.ticket_number || ticketToDelete?.passenger_name || "this booking"}
            </strong>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
        onCancel={() => setTicketToDelete(null)}
        onConfirm={async () => {
          if (!ticketToDelete) return;

          setIsDeleting(true);
          try {
            await deleteTicketBooking(ticketToDelete.id);
            toast.success("Booking deleted successfully");
            setTicketToDelete(null);
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete booking");
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );
}
