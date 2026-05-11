-- Migration: Add settlement and remarks fields to ticket_bookings
-- Created at: 2026-05-11

ALTER TABLE ticket_bookings 
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES operator_settlements(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS paid_to_operator_name TEXT,
ADD COLUMN IF NOT EXISTS paid_to_operator_mobile TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index for settlement_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ticket_bookings_settlement_id ON ticket_bookings(settlement_id);
