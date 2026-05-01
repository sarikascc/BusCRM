"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTicketBooking } from "@/lib/actions/ticket.actions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Phone,
  Bus,
  Hash,
  Wind,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wallet,
  Briefcase,
} from "lucide-react";

export default function TicketBookingList({
  initialTickets = [],
  cities = [],
}: {
  initialTickets: any[];
  cities?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketToDelete, setTicketToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  const filteredTickets = initialTickets.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (ticket.passenger_name?.toLowerCase() || "").includes(searchLower) ||
      (ticket.mobile_number || "").includes(searchLower) ||
      (ticket.ticket_number?.toLowerCase() || "").includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = filteredTickets.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  async function handleDelete() {
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
  }

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] overflow-hidden relative shadow-sm">
      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-3 items-center bg-slate-50/50 shrink-0">
        <div className="relative w-full xl:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, mobile or ticket..."
            className="input-primary pl-9 py-2 text-sm w-full bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-[#3da9d4] hover:border-[#3da9d4]/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Bus className="w-12 h-12 mb-3 text-slate-200" />
            <p className="text-sm font-medium">No bookings found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-4 font-bold">Ticket Info</th>
                <th className="px-4 py-4 font-bold">Passenger</th>
                <th className="px-4 py-4 font-bold">Route & Pickup</th>
                <th className="px-4 py-4 font-bold">Journey</th>
                <th className="px-4 py-4 font-bold">Seats</th>
                <th className="px-4 py-4 font-bold">Bus & Type</th>
                <th className="px-4 py-4 font-bold">Operator & Payment</th>
                <th className="px-4 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#3da9d4]">
                        {ticket.ticket_number || "NO-TKT"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Booked: {new Date(ticket.booking_date).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{ticket.passenger_name}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {ticket.mobile_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-slate-700 font-semibold flex items-center gap-1.5">
                        {ticket.pickup_city?.name} <ArrowRight className="w-3 h-3 text-slate-400" /> {ticket.drop_city?.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{ticket.pickup_area} → {ticket.drop_location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(ticket.journey_date).toLocaleDateString("en-GB")}
                      </span>
                      <span className="text-xs text-[#3da9d4] font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {ticket.pickup_time.slice(0, 5)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">
                        {ticket.seat_numbers} / {ticket.total_seats}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Seats / Total
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.bus_number || "N/A"}
                      </span>
                      <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded font-bold uppercase ${ticket.travel_type === 'AC' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                        {ticket.travel_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#3da9d4]" />
                        {ticket.operator?.operator_name || "N/A"}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-emerald-600">₹{ticket.amount || 0}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Wallet className="w-3 h-3" /> {ticket.payment_type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 italic">
                        {ticket.account?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setTicketToDelete(ticket)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="py-2 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
        <span className="text-sm text-slate-500 font-medium">
          Showing <strong className="text-slate-700">{filteredTickets.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-slate-700">{Math.min(startIndex + itemsPerPage, filteredTickets.length)}</strong> of <strong className="text-slate-700">{filteredTickets.length}</strong> bookings
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 text-sm font-bold text-[#3da9d4] bg-[#3da9d4]/10 border border-[#3da9d4]/20 rounded-lg">
            {currentPage} / {Math.max(1, totalPages)}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

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
        onConfirm={handleDelete}
      />
    </div>
  );
}
