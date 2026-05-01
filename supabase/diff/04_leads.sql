-- 1. Custom Enums
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'lead_type'
  ) THEN
    EXECUTE 'CREATE TYPE lead_type AS ENUM (''Ticket'', ''Parcel'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'lead_status'
  ) THEN
    EXECUTE 'CREATE TYPE lead_status AS ENUM (''Open'', ''Follow Up'', ''Completed'', ''Cancelled'', ''Auto Closed'')';
  END IF;
END
$$;

-- Add new statuses safely
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'New';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Follow Up';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Booked';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Cancelled';

-- 2. Leads Table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  from_city_id UUID REFERENCES cities(id) NOT NULL,
  to_city_id UUID REFERENCES cities(id) NOT NULL,
  journey_date DATE NOT NULL,
  type lead_type NOT NULL,
  number_of_seats INTEGER,
  parcel_count INTEGER,
  notes TEXT,
  status lead_status DEFAULT 'Open' NOT NULL,
  next_follow_up_date DATE,
  cancellation_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 4. Constraints for required fields based on lead type
ALTER TABLE leads
ADD CONSTRAINT check_ticket_seats 
CHECK (
  (type = 'Ticket' AND number_of_seats IS NOT NULL) OR 
  (type != 'Ticket')
);

ALTER TABLE leads
ADD CONSTRAINT check_parcel_count 
CHECK (
  (type = 'Parcel' AND parcel_count IS NOT NULL) OR 
  (type != 'Parcel')
);

ALTER TABLE leads
ADD CONSTRAINT check_cancellation_reason
CHECK (
  (status = 'Cancelled' AND cancellation_reason IS NOT NULL) OR 
  (status != 'Cancelled')
);

-- 5. Add the updated_at column & trigger
ALTER TABLE leads 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_modtime
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 6. POLICIES FOR 'leads' TABLE
CREATE POLICY "All authenticated users can manage leads" ON leads
FOR ALL TO authenticated
USING (true);