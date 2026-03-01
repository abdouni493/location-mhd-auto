-- Add next_vidange_km column to maintenance table if it doesn't exist
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS next_vidange_km INTEGER DEFAULT 0;

-- Add comment to the column
COMMENT ON COLUMN public.maintenance.next_vidange_km IS 'Kilométrage prévu pour la prochaine vidange (pour type vidange)';

-- Ensure the maintenance table has proper columns
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS type TEXT NOT NULL;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS name TEXT NOT NULL;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS cost NUMERIC NOT NULL;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS date TIMESTAMP NOT NULL;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
