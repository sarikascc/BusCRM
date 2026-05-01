-- 1. Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'travel_type') THEN
    CREATE TYPE travel_type AS ENUM ('AC', 'Non-AC');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
    CREATE TYPE payment_type AS ENUM ('Cash', 'UPI');
  END IF;
END
$$;

-- 2. Ticket Bookings Table
CREATE TABLE ticket_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
  pickup_city_id UUID REFERENCES cities(id) NOT NULL,
  pickup_area TEXT NOT NULL,
  drop_city_id UUID REFERENCES cities(id) NOT NULL,
  drop_location TEXT NOT NULL,
  journey_date DATE NOT NULL,
  booking_date DATE DEFAULT CURRENT_DATE NOT NULL,
  passenger_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  seat_numbers TEXT NOT NULL,
  total_seats INTEGER NOT NULL,
  pickup_time TIME NOT NULL,
  bus_number TEXT,
  travel_type travel_type NOT NULL,
  ticket_number TEXT, -- Manual Ticket Number
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  payment_type payment_type,
  amount DECIMAL(15, 2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Enable RLS
ALTER TABLE ticket_bookings ENABLE ROW LEVEL SECURITY;

-- 4. Trigger for updated_at
CREATE TRIGGER update_ticket_bookings_modtime
BEFORE UPDATE ON ticket_bookings
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 5. POLICIES
CREATE POLICY "All authenticated users can manage ticket_bookings" ON ticket_bookings
FOR ALL TO authenticated
USING (true);
