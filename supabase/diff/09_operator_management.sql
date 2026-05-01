-- 09_operator_management.sql
-- Create Operators Table
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_name TEXT NOT NULL,
    person_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    commission_percentage DECIMAL(5, 2) DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Create basic policies (Allow all for now, as per existing patterns)
CREATE POLICY "Allow all on operators" ON operators FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(operator_name);
CREATE INDEX IF NOT EXISTS idx_operators_mobile ON operators(mobile_number);
