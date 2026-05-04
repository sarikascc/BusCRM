-- 10_operator_settlements.sql

-- 1. Create Operator Settlements Table
CREATE TABLE IF NOT EXISTS operator_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID REFERENCES operators(id) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    commission_percentage DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) NOT NULL,
    payable_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) NOT NULL,
    received_by TEXT,
    receiver_mobile TEXT,
    payment_method TEXT CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer')),
    reference_number TEXT,
    settlement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add settlement columns to ticket_bookings
ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES operator_settlements(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS paid_to_operator_name TEXT,
ADD COLUMN IF NOT EXISTS paid_to_operator_mobile TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- 3. Enable RLS
ALTER TABLE operator_settlements ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Allow all on operator_settlements" ON operator_settlements FOR ALL USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_settlements_operator_id ON operator_settlements(operator_id);
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_settlement_id ON ticket_bookings(settlement_id);
