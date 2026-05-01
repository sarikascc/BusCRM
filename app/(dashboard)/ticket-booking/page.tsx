import TicketBookingForm from "@/components/ticket/TicketBookingForm";
import TicketBookingList from "@/components/ticket/TicketBookingList";
import { getTicketBookings } from "@/lib/actions/ticket.actions";
import { getCities } from "@/lib/actions/lead.actions";

export default async function TicketBookingPage() {
  const [tickets, cities] = await Promise.all([
    getTicketBookings(),
    getCities(),
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <TicketBookingList initialTickets={tickets} cities={cities} />
      </div>

      <div className="w-full lg:w-[450px] shrink-0 min-h-0 h-full overflow-y-auto custom-scrollbar">
        <TicketBookingForm />
      </div>
    </div>
  );
}
