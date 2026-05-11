"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTicketBooking, updateTicketBooking } from "@/lib/actions/ticket.actions";
import { addManualCustomer } from "@/lib/actions/lead.actions";
import {
  Loader2,
  MapPin,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  User,
  Calendar,
  Clock,
  Bus,
  Wind,
  Hash,
  CreditCard,
  DollarSign,
  Briefcase,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import OperatorModal from "@/components/operators/OperatorModal";

interface City {
  id: string;
  name: string;
}

interface Operator {
  id: string;
  operator_name: string;
  person_name?: string | null;
  mobile_number?: string | null;
}

interface Account {
  id: string;
  name: string;
}

interface CustomerSuggestion {
  name: string | null;
  mobile_number: string | null;
}

interface TicketBooking {
  id: string;
  mobile_number: string;
  passenger_name: string;
  pickup_city_id: string;
  pickup_city?: { name?: string | null } | null;
  drop_city_id: string;
  drop_city?: { name?: string | null } | null;
  journey_date?: string | null;
  booking_date?: string | null;
  pickup_time?: string | null;
  bus_number?: string | null;
  ticket_number?: string | null;
  seat_numbers?: string | null;
  total_seats?: number | null;
  operator_id?: string | null;
  account_id?: string | null;
  travel_type: "AC" | "Non-AC";
  payment_type: "Cash" | "UPI";
  amount?: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  booking?: TicketBooking | null;
}

function CitySelector({
  label,
  name,
  cities,
  onAddCity,
  selectedCity,
  onSelect,
  alignMenu = "left",
}: {
  label: string;
  name: string;
  cities: City[];
  onAddCity: (name: string) => Promise<City | null>;
  selectedCity: City | null;
  onSelect: (city: City | null) => void;
  alignMenu?: "left" | "right";
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputValue = isOpen ? search : selectedCity?.name || search;
  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const hasExactMatch = cities.some(
    (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase(),
  );

  const handleSelect = (city: City) => {
    onSelect(city);
    setSearch(city.name);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    if (!inputValue.trim()) return;
    setIsAdding(true);
    const newCity = await onAddCity(inputValue.trim());
    if (newCity) {
      onSelect(newCity);
      setSearch(newCity.name);
      setIsOpen(false);
    }
    setIsAdding(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
        {label} *
      </label>
      <input type="hidden" name={name} value={selectedCity?.id || ""} />
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="input-primary pl-9 bg-white text-sm py-2.5 h-11 rounded-xl font-bold"
          placeholder="Select City"
          value={inputValue}
          autoComplete="off"
          onChange={(e) => {
            setSearch(e.target.value);
            onSelect(null);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearch(selectedCity ? selectedCity.name : "");
            setIsOpen(true);
          }}
        />
      </div>

      {isOpen && (
        <div
          className={`absolute z-[110] mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 ${alignMenu === "right" ? "right-0" : "left-0"}`}
        >
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {city.name}
              </button>
            ))}
          </div>
          {!hasExactMatch && inputValue.trim() !== "" && (
            <div className="p-2 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAddNew}
                disabled={isAdding}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#3da9d4] bg-[#3da9d4]/10 hover:bg-[#3da9d4]/20 rounded-lg transition-colors"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add &quot;{inputValue}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OperatorSelector({
  operators,
  selectedOperatorId,
  onSelect,
  onCreateClick,
}: {
  operators: Operator[];
  selectedOperatorId: string;
  onSelect: (operatorId: string) => void;
  onCreateClick: () => void;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOperator =
    operators.find((op) => op.id === selectedOperatorId) || null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputValue = isOpen
    ? search
    : selectedOperator?.operator_name || search;
  const normalizedSearch = inputValue.trim().toLowerCase();
  const filteredOperators = operators.filter((op) => {
    const values = [
      op.operator_name,
      op.person_name || "",
      op.mobile_number || "",
    ];

    return values.some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    );
  });

  const handleSelect = (operator: Operator) => {
    onSelect(operator.id);
    setSearch(operator.operator_name);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
        Operator *
      </label>
      <input type="hidden" name="operator_id" value={selectedOperatorId} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inputValue}
            autoComplete="off"
            required
            onChange={(e) => {
              setSearch(e.target.value);
              onSelect("");
              setIsOpen(true);
            }}
            onFocus={() => {
              setSearch(selectedOperator ? selectedOperator.operator_name : "");
              setIsOpen(true);
            }}
            className="input-primary w-full text-sm h-10 rounded-lg pl-10 bg-white font-bold"
            placeholder="Search Operator"
          />
        </div>
        <button
          type="button"
          onClick={onCreateClick}
          className="h-10 px-4 bg-[#3da9d4] text-white rounded-lg text-sm whitespace-nowrap"
        >
          Create Operator
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-1">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredOperators.length > 0 ? (
              filteredOperators.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => handleSelect(op)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                >
                  <span className="block font-bold text-slate-800">
                    {op.operator_name}
                  </span>
                  {(op.person_name || op.mobile_number) && (
                    <span className="block text-xs font-medium text-slate-500 mt-0.5">
                      {[op.person_name, op.mobile_number]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm font-medium text-slate-500">
                No operator found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketBookingModal({ isOpen, onClose, onSuccess, booking }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [cities, setCities] = useState<City[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);

  const [mobileNumber, setMobileNumber] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [travelType, setTravelType] = useState<"AC" | "Non-AC">("AC");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentType, setPaymentType] = useState<"Cash" | "UPI">("Cash");
  const [amount, setAmount] = useState("");

  const [formDataState, setFormDataState] = useState({
    journey_date: "",
    booking_date: "",
    pickup_time: "",
    bus_number: "",
    ticket_number: "",
    seat_numbers: "",
    total_seats: "1",
    operator_id: "",
    account_id: "",
  });

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isOpen) {
      fetchCities();
      fetchOperators();
      fetchAccounts();

      if (booking) {
        setMobileNumber(booking.mobile_number.replace("+91 ", ""));
        setPassengerName(booking.passenger_name);
        setFromCity({ id: booking.pickup_city_id, name: booking.pickup_city?.name || "" });
        setToCity({ id: booking.drop_city_id, name: booking.drop_city?.name || "" });
        setTravelType(booking.travel_type);
        setPaymentType(booking.payment_type);
        setAmount(booking.amount?.toString() || "");
        setFormDataState({
          journey_date: booking.journey_date || "",
          booking_date: booking.booking_date || "",
          pickup_time: booking.pickup_time || "",
          bus_number: booking.bus_number || "",
          ticket_number: booking.ticket_number || "",
          seat_numbers: booking.seat_numbers || "",
          total_seats: booking.total_seats?.toString() || "1",
          operator_id: booking.operator_id || "",
          account_id: booking.account_id || "",
        });
      } else {
        setMobileNumber("");
        setPassengerName("");
        setFromCity(null);
        setToCity(null);
        setTravelType("AC");
        setPaymentType("Cash");
        setAmount("");
        setFormDataState({
          journey_date: todayStr,
          booking_date: todayStr,
          pickup_time: "",
          bus_number: "",
          ticket_number: "",
          seat_numbers: "",
          total_seats: "1",
          operator_id: "",
          account_id: "",
        });
      }
    }
  }, [isOpen, booking]);

  useEffect(() => {
    async function searchCustomers() {
      if (mobileNumber.length >= 3 && !booking) {
        const { data } = await supabase
          .from("customers")
          .select("name, mobile_number")
          .ilike("mobile_number", `%${mobileNumber}%`)
          .limit(5);

        if (data && data.length > 0) {
          setCustomerSuggestions(data);
          setShowSuggestions(true);
        } else {
          setCustomerSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setCustomerSuggestions([]);
        setShowSuggestions(false);
      }
    }

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [mobileNumber]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSelectCustomer = (customer: CustomerSuggestion) => {
    const rawNumber = customer.mobile_number
      ? customer.mobile_number.replace("+91 ", "")
      : "";
    setMobileNumber(rawNumber);
    setPassengerName(customer.name || "");
    setShowSuggestions(false);
  };

  async function fetchCities() {
    const { data } = await supabase.from("cities").select("*").order("name");
    if (data) setCities(data);
  }

  async function handleAddCity(cityName: string): Promise<City | null> {
    const { data, error } = await supabase
      .from("cities")
      .insert([{ name: cityName }])
      .select()
      .single();
    if (!error && data) {
      setCities((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return data;
    }
    return null;
  }

  async function fetchOperators() {
    const { data } = await supabase
      .from("operators")
      .select("*")
      .eq("status", "Active")
      .order("operator_name");
    if (data) setOperators(data);
  }

  async function fetchAccounts() {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("status", "Active")
      .order("name");
    if (data) setAccounts(data);
  }

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    if (!fromCity?.id || !toCity?.id) {
      toast.error("Please select a valid Pickup and Drop city.");
      setIsSubmitting(false);
      return;
    }

    if (!formDataState.operator_id) {
      toast.error("Please select a valid Operator.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      passenger_name: passengerName,
      mobile_number: `+91 ${mobileNumber}`,
      pickup_city_id: fromCity.id,
      drop_city_id: toCity.id,
      journey_date: formDataState.journey_date,
      booking_date: formDataState.booking_date || todayStr,
      seat_numbers: formDataState.seat_numbers.trim(),
      total_seats: parseInt(formDataState.total_seats, 10) || 1,
      pickup_time: formDataState.pickup_time,
      bus_number: formDataState.bus_number,
      travel_type: travelType,
      ticket_number: formDataState.ticket_number,
      operator_id: formDataState.operator_id || undefined,
      account_id: formDataState.account_id || undefined,
      payment_type: paymentType,
      amount: parseFloat(amount) || 0,
    };

    try {
      // Check if customer exists and add if not (Auto-sync logic)
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("mobile_number", payload.mobile_number)
        .maybeSingle();

      if (!existingCustomer) {
        await addManualCustomer(payload.passenger_name, payload.mobile_number);
      }

      if (booking) {
        await updateTicketBooking(booking.id, payload);
        toast.success("Booking updated successfully!");
      } else {
        await createTicketBooking(payload);
        toast.success("Booking created successfully!");
      }
      onSuccess();
      onClose();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(booking ? "Failed to update booking." : "Failed to add ticket booking.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormDataState(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[100vh]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-[20px] font-bold text-slate-800">
              {booking ? "Update Ticket Booking" : "Ticket Booking"}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              {booking ? "Modify existing booking details" : "Fill in the details to book a seat"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Operator Selection */}

              <OperatorSelector
                operators={operators}
                selectedOperatorId={formDataState.operator_id}
                onSelect={(operatorId) =>
                  setFormDataState((prev) => ({
                    ...prev,
                    operator_id: operatorId,
                  }))
                }
                onCreateClick={() => setIsOperatorModalOpen(true)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div ref={searchWrapperRef} className="relative">
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-100 mr-2">
                      <span className="text-slate-500 text-sm font-bold">+91</span>
                    </div>
                    <input
                      required
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        setShowSuggestions(true);
                      }}
                      maxLength={10}
                      autoComplete="off"
                      className="input-primary pl-12 font-bold text-sm h-10 rounded-lg w-full tracking-wider"
                      placeholder="12345 67890"
                    />
                  </div>

                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-1">
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {customerSuggestions.map((cust, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectCustomer(cust)}
                            className="w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                          >
                            <span className="font-bold text-slate-800">
                              {cust.name || "Unknown"}
                            </span>
                            <span className="text-slate-500 font-medium text-xs">
                              {cust.mobile_number}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold"
                      placeholder="Full Name"
                    />
                  </div>
                </div>
              </div>

              {/* Journey Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Journey Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="date"
                      name="journey_date"
                      value={formDataState.journey_date}
                      onChange={handleInputChange}
                      min={todayStr}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Booking Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      name="booking_date"
                      value={formDataState.booking_date}
                      onChange={handleInputChange}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bus & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Pickup Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="time"
                      name="pickup_time"
                      value={formDataState.pickup_time}
                      onChange={handleInputChange}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Bus Number
                  </label>
                  <div className="relative">
                    <Bus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="bus_number"
                      value={formDataState.bus_number}
                      onChange={handleInputChange}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 uppercase font-bold"
                      placeholder="GJ 01 XX 1234"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Route Selection */}
              <div className="flex items-center gap-2">
                <CitySelector
                  label="Pickup City"
                  name="pickup_city_id"
                  cities={cities}
                  onAddCity={handleAddCity}
                  selectedCity={fromCity}
                  onSelect={setFromCity}
                  alignMenu="left"
                />
                <button
                  type="button"
                  onClick={handleSwapCities}
                  className="mt-7 p-2 rounded-full bg-slate-50 hover:bg-[#3da9d4]/10 text-slate-400 hover:text-[#3da9d4] transition-colors shrink-0 border border-slate-200"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
                <CitySelector
                  label="Drop City"
                  name="drop_city_id"
                  cities={cities}
                  onAddCity={handleAddCity}
                  selectedCity={toCity}
                  onSelect={setToCity}
                  alignMenu="right"
                />
              </div>

              {/* Seat Details */}
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Total Seats *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="number"
                      name="total_seats"
                      value={formDataState.total_seats}
                      onChange={handleInputChange}
                      min={1}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold"
                      placeholder="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Seat Number(s) *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      name="seat_numbers"
                      value={formDataState.seat_numbers}
                      onChange={handleInputChange}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 uppercase font-bold"
                      placeholder="A1, A2"
                    />
                  </div>
                </div>

              </div>

              {/* Ticket Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Ticket No
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="ticket_number"
                      value={formDataState.ticket_number}
                      onChange={handleInputChange}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold"
                      placeholder="T-1001"
                    />
                  </div>
                </div>
                {/* Travel Type & Account */}

                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Travel Type *
                  </label>
                  <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 h-10">
                    <button
                      type="button"
                      onClick={() => setTravelType("AC")}
                      className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${travelType === "AC" ? "bg-white text-[#3da9d4] shadow-sm border border-slate-100" : "text-slate-500"}`}
                    >
                      <Wind className="w-3 h-3" /> AC
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravelType("Non-AC")}
                      className={`flex-1 py-1 text-[12px] font-bold rounded-md transition-all ${travelType === "Non-AC" ? "bg-white text-[#3da9d4] shadow-sm border border-slate-100" : "text-slate-500"}`}
                    >
                      Non-AC
                    </button>
                  </div>


                </div>
              </div>


              {/* Payment Type & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Select Account *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      required
                      name="account_id"
                      value={formDataState.account_id}
                      onChange={handleInputChange}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 appearance-none bg-white font-bold"
                    >
                      <option value="">Select Account</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                    Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input-primary w-full text-sm h-10 rounded-lg pl-10 font-bold"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand/20 hover:bg-brand-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> {booking ? "Update Booking" : "Confirm Booking"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <OperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        onSuccess={(newOp) => {
          setOperators((prev) => [...prev, newOp as any].sort((a, b) => a.operator_name.localeCompare(b.operator_name)));
          setFormDataState((prev) => ({
            ...prev,
            operator_id: newOp.id,
          }));
        }}
      />
    </div>
  );
}
