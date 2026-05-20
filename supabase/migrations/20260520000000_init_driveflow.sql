-- DriveFlow CRM Initial Schema

-- 1. Enums
CREATE TYPE lead_source AS ENUM ('website', 'facebook', 'google', 'offline', 'referral');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiation', 'converted', 'lost');
CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE lead_health AS ENUM ('hot', 'warm', 'cold', 'stalled');
CREATE TYPE interaction_type AS ENUM ('call', 'email', 'note', 'meeting', 'status_change');

-- 2. Tables
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    business_name TEXT,
    source lead_source DEFAULT 'website',
    status lead_status DEFAULT 'new',
    priority lead_priority DEFAULT 'medium',
    health lead_health DEFAULT 'warm',
    score INTEGER DEFAULT 0,
    notes TEXT,
    assigned_to UUID,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    follow_up_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    type interaction_type NOT NULL,
    content TEXT,
    actor_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending',
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Mock Data
INSERT INTO leads (name, email, phone, business_name, source, status, priority, health, score, notes, follow_up_at)
VALUES 
('John Doe', 'john@example.com', '+1234567890', 'Doe Motors', 'google', 'new', 'high', 'hot', 85, 'Interested in SUV models', NOW() + INTERVAL '1 day'),
('Jane Smith', 'jane@auto.com', '+1987654321', 'Auto World', 'facebook', 'contacted', 'medium', 'warm', 60, 'Needs quote for fleet purchase', NOW() + INTERVAL '2 days'),
('Robert Brown', 'robert@dealership.com', '+1122334455', 'Brown Bros', 'website', 'qualified', 'low', 'cold', 30, 'Initial inquiry from website', NULL);
