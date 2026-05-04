
import TicketBookingList from "@/components/ticket/TicketBookingList";
import { getTicketBookings } from "@/lib/actions/ticket.actions";
import { getCities } from "@/lib/actions/lead.actions";
import { getAccounts } from "@/lib/actions/accounting.actions";
import { getOperatorSettlements } from "@/lib/actions/operator-settlement.actions";

export default async function TicketBookingPage() {
  const [tickets, cities, accounts, settlements] = await Promise.all([
    getTicketBookings(),
    getCities(),
    getAccounts(),
    getOperatorSettlements(),
  ]);

  return (
    <div className="h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <TicketBookingList
        initialTickets={tickets}
        cities={cities}
        accounts={accounts}
        settlements={settlements}
      />
    </div>
  );
}
