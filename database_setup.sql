
-- 1. SETUP EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CREATE ROLES ENUM
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'worker', 'driver');
    END IF;
END $$;

-- 3. HELPER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CREATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL, 
    role user_role DEFAULT 'worker' NOT NULL,
    full_name TEXT,
    phone TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    immatriculation TEXT UNIQUE NOT NULL,
    color TEXT,
    chassis_number TEXT,
    fuel_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    seats INTEGER DEFAULT 5,
    doors INTEGER DEFAULT 5,
    daily_rate NUMERIC NOT NULL,
    weekly_rate NUMERIC,
    monthly_rate NUMERIC,
    deposit NUMERIC,
    status TEXT DEFAULT 'disponible',
    current_location TEXT,
    mileage INTEGER DEFAULT 0,
    insurance_expiry DATE,
    tech_control_date DATE,
    insurance_info TEXT,
    main_image TEXT,
    secondary_images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CREATE AGENCIES TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    id_card_number TEXT,
    wilaya TEXT,
    address TEXT,
    license_number TEXT,
    license_expiry DATE,
    profile_picture TEXT,
    document_images TEXT[] DEFAULT '{}',
    document_left_at_store TEXT DEFAULT 'Aucun',
    total_reservations INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. CREATE RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'confermer',
    total_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    pickup_agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    return_agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    caution_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    with_tva BOOLEAN DEFAULT false,
    tva_percentage NUMERIC(5,2) DEFAULT 19,
    options JSONB DEFAULT '[]'::jsonb,
    activation_log JSONB,
    termination_log JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ENSURE COLUMNS EXIST (IN CASE TABLES WERE CREATED MANUALLY OR WITHOUT UPDATED_AT)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
-- Ensure tva_percentage exists (new in schema)
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS tva_percentage NUMERIC(5,2) DEFAULT 19;

-- 9. APPLY UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_modtime ON public.vehicles;
CREATE TRIGGER update_vehicles_modtime BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_agencies_modtime ON public.agencies;
CREATE TRIGGER update_agencies_modtime BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_modtime ON public.customers;
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_modtime ON public.reservations;
CREATE TRIGGER update_reservations_modtime BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 10. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 11. POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow full access for authenticated users to vehicles" ON public.vehicles;
CREATE POLICY "Allow full access for authenticated users to vehicles" ON public.vehicles FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to agencies" ON public.agencies;
CREATE POLICY "Allow full access for authenticated users to agencies" ON public.agencies FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to customers" ON public.customers;
CREATE POLICY "Allow full access for authenticated users to customers" ON public.customers FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow full access for authenticated users to reservations" ON public.reservations;
CREATE POLICY "Allow full access for authenticated users to reservations" ON public.reservations FOR ALL TO authenticated USING (true);

-- 12. TRIGGER FOR AUTO-CREATING PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1), 
    new.email, 
    CASE 
      WHEN new.email = 'admin@admin.com' THEN 'admin'::user_role 
      ELSE 'worker'::user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. REFRESH CACHE
NOTIFY pgrst, 'reload schema';
