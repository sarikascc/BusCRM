"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTicketBooking } from "@/lib/actions/ticket.actions";
import {
  Loader2,
  MapPin,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  User,
  Phone,
  Calendar,
  Clock,
  Bus,
  Wind,
  Hash,
  Wallet,
  CreditCard,
  DollarSign,
  Briefcase,
} from "lucide-react";

interface City {
  id: string;
  name: string;
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
    setSearch(selectedCity ? selectedCity.name : "");
  }, [selectedCity]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch(selectedCity ? selectedCity.name : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCity]);

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const hasExactMatch = cities.some(
    (c) => c.name.toLowerCase() === search.trim().toLowerCase(),
  );

  const handleSelect = (city: City) => {
    onSelect(city);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    if (!search.trim()) return;
    setIsAdding(true);
    const newCity = await onAddCity(search.trim());
    if (newCity) {
      onSelect(newCity);
      setIsOpen(false);
    }
    setIsAdding(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
        {label} *
      </label>
      <input type="hidden" name={name} value={selectedCity?.id || ""} />
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="input-primary pl-9 bg-white text-sm py-2.5"
          placeholder="Select City"
          value={search}
          autoComplete="off"
          onChange={(e) => {
            setSearch(e.target.value);
            onSelect(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1 w-[240px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 ${alignMenu === "right" ? "right-0" : "left-0"}`}
        >
          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
          {!hasExactMatch && search.trim() !== "" && (
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
                Add "{search}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TicketBookingForm() {
  const supabase = createClient();
  const [cities, setCities] = useState<City[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [mobileNumber, setMobileNumber] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [travelType, setTravelType] = useState<"AC" | "Non-AC">("AC");
  const [operators, setOperators] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [paymentType, setPaymentType] = useState<"Cash" | "UPI">("Cash");
  const [amount, setAmount] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchCities();
    fetchOperators();
    fetchAccounts();
  }, []);

  useEffect(() => {
    async function searchCustomers() {
      if (mobileNumber.length >= 3) {
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

  const handleSelectCustomer = (customer: any) => {
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
    setShowSuccess(false);

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const pickupCityId = formData.get("pickup_city_id") as string;
    const dropCityId = formData.get("drop_city_id") as string;

    if (!pickupCityId || !dropCityId) {
      alert("Please select a valid Pickup and Drop city.");
      setIsSubmitting(false);
      return;
    }

    const seatCombined = (formData.get("seat_numbers_combined") as string) || "";
    let seatNumbers = seatCombined;
    let totalSeats = 1;

    if (seatCombined.includes("/")) {
      const [seats, total] = seatCombined.split("/");
      seatNumbers = seats.trim();
      totalSeats = parseInt(total.trim(), 10) || 1;
    }

    try {
      await createTicketBooking({
        passenger_name: passengerName,
        mobile_number: `+91 ${mobileNumber}`,
        pickup_city_id: pickupCityId,
        pickup_area: formData.get("pickup_area") as string,
        drop_city_id: dropCityId,
        drop_location: formData.get("drop_location") as string,
        journey_date: formData.get("journey_date") as string,
        booking_date: (formData.get("booking_date") as string) || todayStr,
        seat_numbers: seatNumbers,
        total_seats: totalSeats,
        pickup_time: formData.get("pickup_time") as string,
        bus_number: formData.get("bus_number") as string,
        travel_type: travelType,
        ticket_number: formData.get("ticket_number") as string,
        operator_id: formData.get("operator_id") as string || undefined,
        account_id: formData.get("account_id") as string || undefined,
        payment_type: paymentType,
        amount: parseFloat(amount) || 0,
      });

      formElement.reset();
      setMobileNumber("");
      setPassengerName("");
      setFromCity(null);
      setToCity(null);
      setTravelType("AC");
      setPaymentType("Cash");
      setAmount("");

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Failed to add ticket booking.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="saas-card bg-white p-5 flex flex-col border-t-4 border-t-[#3da9d4] shadow-sm relative overflow-hidden h-fit max-h-full">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-slate-800">New Ticket Booking</h2>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Book a new seat
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
        <div className="flex flex-col gap-5 overflow-y-auto pr-1 custom-scrollbar pb-4">
          {/* Operator Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Operator *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                required
                name="operator_id"
                className="input-primary w-full text-sm py-2.5 pl-10 appearance-none bg-white"
              >
                <option value="">Select Operator</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.operator_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1 shrink-0" />
          {/* Passenger Details */}
        
            <div ref={searchWrapperRef} className="relative z-40">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
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
                  className="input-primary pl-12 font-bold text-sm py-2.5 w-full tracking-wider"
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
     
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Passenger Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="input-primary w-full text-sm py-2.5 pl-10"
                placeholder="Full Name"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1 shrink-0" />

          {/* Pickup Details */}
          <div className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Pickup Area *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    name="pickup_area"
                    className="input-primary w-full text-sm py-2.5 pl-10"
                    placeholder="Area/Point"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Drop Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    name="drop_location"
                    className="input-primary w-full text-sm py-2.5 pl-10"
                    placeholder="Location/Point"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1 shrink-0" />

          {/* Journey Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Journey Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="date"
                  name="journey_date"
                  min={todayStr}
                  className="input-primary w-full text-sm py-2.5 pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Booking Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  name="booking_date"
                  defaultValue={todayStr}
                  className="input-primary w-full text-sm py-2.5 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Seat Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Seat Number(s) / Total Seats * (e.g. A, B / 2)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                type="text"
                name="seat_numbers_combined"
                className="input-primary w-full text-sm py-2.5 pl-10 uppercase"
                placeholder="A, B / 2"
              />
            </div>
          </div>

          {/* Bus & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Pickup Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="time"
                  name="pickup_time"
                  className="input-primary w-full text-sm py-2.5 pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Bus Number
              </label>
              <div className="relative">
                <Bus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="bus_number"
                  className="input-primary w-full text-sm py-2.5 pl-10 uppercase"
                  placeholder="GJ 01 XX 1234"
                />
              </div>
            </div>
          </div>

          {/* Travel Type & Ticket Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Travel Type *
              </label>
              <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setTravelType("AC")}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${travelType === "AC" ? "bg-white text-[#3da9d4] shadow-sm border border-slate-100" : "text-slate-500"}`}
                >
                  <Wind className="w-3 h-3" /> AC
                </button>
                <button
                  type="button"
                  onClick={() => setTravelType("Non-AC")}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${travelType === "Non-AC" ? "bg-white text-[#3da9d4] shadow-sm border border-slate-100" : "text-slate-500"}`}
                >
                  Non-AC
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Ticket Number (Manual)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="ticket_number"
                  className="input-primary w-full text-sm py-2.5 pl-10"
                  placeholder="T-1001"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1 shrink-0" />

          {/* Payment Details */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" /> Payment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Select Account *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    required
                    name="account_id"
                    className="input-primary w-full text-sm py-2.5 pl-10 appearance-none bg-white"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Account Type *
                </label>
                <div className="flex rounded-lg border border-slate-200 p-1 bg-white">
                  <button
                    type="button"
                    onClick={() => setPaymentType("Cash")}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${paymentType === "Cash" ? "bg-[#3da9d4] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("UPI")}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${paymentType === "UPI" ? "bg-[#3da9d4] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    UPI
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-primary w-full text-sm py-2.5 pl-10"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 shrink-0 flex flex-col gap-3 bg-white border-t border-slate-100">
          {showSuccess && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 uppercase bg-emerald-50 py-2 rounded-lg border border-emerald-100 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" /> Booking saved successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-brand w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-xl active:scale-95 transition-transform"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Confirm Booking
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
