"use client";

import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Bus,
  Wind,
  Hash,
  Briefcase,
  CreditCard,
  CheckCircle2,
  Ticket,
  ArrowRight,
  Printer,
  Share2,
  Copy
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}



export default function TicketDetailsModal({ isOpen, onClose, booking }: Props) {
  if (!isOpen || !booking) return null;

  const totalSales = Number(booking.amount || 0);
  const commissionPercent = Number(booking.operator?.commission || 10); // default 10%
  const commissionAmount = (totalSales * commissionPercent) / 100;
  const payable = totalSales - commissionAmount;


  return (
    <div className="fixed inset-0 z-[120] flex items-center h-screen justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all duration-500">
      <div style={{ maxHeight: "85vh", overflowY: "auto" }} className="bg-white  rounded-[20px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-[900px]  flex flex-col relative border border-white/20">

        {/* Header with Gradient Background */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-8 text-black relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/60 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                <Ticket className="w-7 h-7 text-brand" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Booking Voucher</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-brand font-black uppercase tracking-[0.2em] bg-brand/10 px-2 py-0.5 rounded">
                    #{booking.ticket_number || "NO-REF"}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold">|</span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Confirmed</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full transition-all text-slate-300  border border-white/5"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-5 overflow-y-auto custom-scrollbar  bg-slate-50/30">

          {/* Main Journey Card */}
          <div className="relative">
            <div className="bg-white rounded-[12px] p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Origin</p>
                <h4 className="text-lg font-bold text-slate-800">{booking.pickup_city?.name} </h4>
                <MapPin size={14} className="text-[#3da9d4]" />
              </div>

              <div className="flex flex-col items-center justify-center px-4">
                <div className="w-16 h-px bg-slate-200 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center">
                    <ArrowRight size={14} className="text-brand" />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Destination</p>
                <h4 className="text-lg font-bold text-slate-800">{booking.drop_city?.name}</h4>
                <div className="flex items-center gap-1.5 text-slate-500 justify-end">
                  <span className="text-xs font-bold truncate max-w-[140px]">{booking.drop_location}</span>
                  <MapPin size={14} className="text-[#3da9d4]" />
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Passenger & Contact */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full" /> Passenger Details
                </label>
                <div className="bg-white p-4 rounded-[12px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{booking.passenger_name}</p>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">{booking.mobile_number}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Journey Schedule
                </label>
                <div className="bg-white p-4 rounded-[12px] border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">
                      {new Date(booking.journey_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-brand" />
                    <span className="text-sm font-bold text-brand tracking-tight">
                      {booking.pickup_time.slice(0, 5)} Departure
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Logistics & Timing */}
            <div className="space-y-6">

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full" /> Bus Information
                </label>
                <div className="bg-white p-4 rounded-[12px] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                      <Bus size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight uppercase">{booking.bus_number || "N/A"}</p>
                      <p className="text-[10px] font-bold text-brand tracking-widest uppercase mt-0.5">{booking.travel_type}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand rounded-full" /> Assignment
                </label>
                <div className="bg-white p-4 rounded-[12px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator</p>
                      <p className="text-xs font-bold text-slate-800">{booking.operator?.operator_name || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {booking.remarks && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Remarks
                  </label>
                  <div className="bg-white p-4 rounded-[12px] border border-slate-100 shadow-sm">
                    <p className="text-sm font-medium text-slate-700">
                     {booking.remarks}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Footer / Summary */}
          <div className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
            <div className="grid grid-cols-2 gap-6">

              {/* Operator Settlement Card */}
              <div className=" rounded-[16px] p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Sales
                    </p>
                    <p className="text-lg font-black text-slate-800">
                      Rs. {totalSales}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400  uppercase tracking-widest">
                      Commission
                    </p>
                    <p className="text-lg font-black text-sky-500">
                      {commissionPercent}%
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Comm. Amount
                    </p>
                    <p className="text-lg font-black text-emerald-600">
                      Rs. {commissionAmount}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Payable
                    </p>
                    <p className="text-lg font-black text-red-500">
                      Rs. {payable}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-slate-100">
                <div className="p-5 space-y-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Reserved Seats
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-[10px] bg-brand/10 text-brand flex items-center justify-center">
                      <Hash size={16} />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tight">
                      {booking.seat_numbers || "N/A"}
                    </span>
                  </div>
                  <span className="inline-flex text-[11px] font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-[5px] uppercase tracking-widest">
                    {booking.total_seats || 0} {booking.total_seats > 1 ? "Passengers" : "Passenger"}
                  </span>
                </div>

                <div className="p-5 space-y-4 sm:text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Total Fare
                  </p>
                  <div className="text-xl font-black text-slate-800 tracking-tight">
                    Rs. {Number(booking.amount || 0).toLocaleString()}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={`text-[10px] font-black px-3 py-1.5 rounded-[5px] uppercase tracking-widest flex items-center gap-1.5 ${!booking.operator_id
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : booking.settlement_id
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                    >
                      {(!booking.operator_id || booking.settlement_id) ? <CheckCircle2 size={12} /> : null}
                      {!booking.operator_id ? "Collected" : booking.settlement_id ? "Settled" : "Unsettled"}
                    </span>
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-[5px] uppercase tracking-widest border border-slate-200">
                      {/* {booking.payment_type || "N/A"} */}
                            {booking.account?.name ? ` ${booking.account.name} ` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>


          </div>


        </div>

        {/* Action Bar */}
        <div className="p-4 pt-4 flex gap-3 bg-white border-t border-slate-100">


          <button
            className="flex-[2] py-4 bg-brand text-white rounded-2xl font-black text-sm hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 active:scale-95"
            onClick={onClose}
          >
            Done
          </button>
          <button
            className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
