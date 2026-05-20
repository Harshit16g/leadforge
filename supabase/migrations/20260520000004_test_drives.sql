-- ============================================================
-- DriveFlow CRM — Test Drive Bookings Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.test_drives (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id        UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    customer_name  TEXT NOT NULL,
    customer_phone TEXT,
    car_model      TEXT NOT NULL,
    status         TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    assigned_to    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at     TIMESTAMP WITH TIME ZONE,
    completed_at   TIMESTAMP WITH TIME ZONE,
    notes          TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS — open for prototype sandbox
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "test_drives_open" ON public.test_drives;
CREATE POLICY "test_drives_open" ON public.test_drives FOR ALL USING (true) WITH CHECK (true);

-- Seed mock test drives dynamically matching our leads
DO $$
DECLARE
    arjun_id UUID;
    priya_id UUID;
    ananya_id UUID;
    michael_id UUID := '22222222-2222-2222-2222-222222222222';
    sarah_id UUID   := '11111111-1111-1111-1111-111111111111';
    priya_rep_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- Get seeded lead IDs
    SELECT id INTO arjun_id FROM public.leads WHERE name = 'Arjun Mehta' LIMIT 1;
    SELECT id INTO priya_id FROM public.leads WHERE name = 'Priya Saini' LIMIT 1;
    SELECT id INTO ananya_id FROM public.leads WHERE name = 'Ananya Desai' LIMIT 1;

    -- Insert mock test drive records
    IF arjun_id IS NOT NULL THEN
        INSERT INTO public.test_drives (lead_id, customer_name, customer_phone, car_model, status, assigned_to, scheduled_at, notes)
        VALUES (arjun_id, 'Arjun Mehta', '+91 9876543210', 'Hyundai Creta SX (O)', 'scheduled', sarah_id, NOW() + INTERVAL '4 hours', 'Wants standard highway loop test.');
    END IF;

    IF priya_id IS NOT NULL THEN
        INSERT INTO public.test_drives (lead_id, customer_name, customer_phone, car_model, status, assigned_to, scheduled_at, started_at, notes)
        VALUES (priya_id, 'Priya Saini', '+91 8765432109', 'Hyundai Tucson Platinum', 'active', michael_id, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes', 'Ongoing highway drive. Rep Michael Chen accompanying.');
    END IF;

    IF ananya_id IS NOT NULL THEN
        INSERT INTO public.test_drives (lead_id, customer_name, customer_phone, car_model, status, assigned_to, scheduled_at, started_at, completed_at, notes)
        VALUES (ananya_id, 'Ananya Desai', '+91 6543210987', 'Hyundai IONIQ 5', 'completed', priya_rep_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', NOW() - INTERVAL '22 hours', 'Excellent experience. Loved the acceleration and V2L demo.');
    END IF;
END $$;
