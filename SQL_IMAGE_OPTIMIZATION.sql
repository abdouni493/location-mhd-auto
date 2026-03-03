-- IMAGE OPTIMIZATION FOR VEHICLES TABLE
-- Run this to make image loading ultra-fast

-- Index for fast image + vehicle lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_images_display
  ON public.vehicles(id, created_at DESC);

-- Index specifically for main_image queries
CREATE INDEX IF NOT EXISTS idx_vehicles_main_image
  ON public.vehicles(main_image) 
  WHERE main_image IS NOT NULL;

-- Pre-computed view for quick image + metadata display
CREATE MATERIALIZED VIEW IF NOT EXISTS vehicles_with_images_view AS
SELECT 
  id,
  brand,
  model,
  year,
  immatriculation,
  color,
  fuel_type,
  transmission,
  seats,
  daily_rate,
  status,
  current_location,
  main_image,
  created_at,
  updated_at
FROM public.vehicles
WHERE main_image IS NOT NULL AND main_image != ''
ORDER BY created_at DESC;

-- Create indexes on the materialized view
CREATE INDEX IF NOT EXISTS idx_vehicles_images_view_id
  ON vehicles_with_images_view(id);

CREATE INDEX IF NOT EXISTS idx_vehicles_images_view_status
  ON vehicles_with_images_view(status, created_at DESC);

-- Auto-refresh function
CREATE OR REPLACE FUNCTION refresh_vehicles_images_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vehicles_with_images_view;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh trigger
DROP TRIGGER IF EXISTS vehicles_images_refresh ON public.vehicles;

CREATE TRIGGER vehicles_images_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION refresh_vehicles_images_view();

-- GIN index for secondary images (gallery views)
CREATE INDEX IF NOT EXISTS idx_vehicles_secondary_images
  ON public.vehicles USING GIN (secondary_images)
  WHERE secondary_images IS NOT NULL;

-- Analyze table for query optimizer
ANALYZE public.vehicles;

-- Verify indexes created
SELECT 
  indexname, 
  tablename
FROM pg_indexes 
WHERE tablename = 'vehicles' AND indexname LIKE '%image%'
ORDER BY indexname;

-- Check vehicles with main images
SELECT 
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN main_image IS NOT NULL AND main_image != '' THEN 1 END) as with_images,
  COUNT(CASE WHEN main_image IS NULL OR main_image = '' THEN 1 END) as without_images
FROM public.vehicles;

-- List all vehicles with their images
SELECT 
  id,
  brand,
  model,
  immatriculation,
  main_image
FROM public.vehicles
ORDER BY created_at DESC;
