-- ==============================================================================
-- KRISHISAATHI SUPABASE POSTGRESQL SCHEMA
-- Agricultural AI Platform for Indian Farmers
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    village TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for fast mobile number lookups during login
CREATE INDEX IF NOT EXISTS idx_farmers_mobile ON farmers(mobile_number);

-- 3. Soil Reports Table
CREATE TABLE IF NOT EXISTS soil_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    file_url TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    extracted_soil_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Index for farmer queries
CREATE INDEX IF NOT EXISTS idx_soil_reports_farmer_id ON soil_reports(farmer_id);

-- 4. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    soil_report_id UUID REFERENCES soil_reports(id) ON DELETE CASCADE,
    fertilizer_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    crop_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for fast recommendations lookup
CREATE INDEX IF NOT EXISTS idx_recommendations_farmer_id ON recommendations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_soil_report_id ON recommendations(soil_report_id);

-- 5. Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for ordering farmer conversation history
CREATE INDEX IF NOT EXISTS idx_chat_history_farmer_timestamp ON chat_history(farmer_id, timestamp);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures one farmer cannot access another farmer's data
-- ==============================================================================

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Note: When accessing Supabase via FastAPI backend service key or JWT token,
-- application authorization enforces strict farmer_id matching.
