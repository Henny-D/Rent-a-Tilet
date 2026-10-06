-- Public browsing must not expose owner_id or lender name.
-- 1) View with safe columns only, live dresses, definer rights (default) so it bypasses RLS as view owner.
CREATE OR REPLACE VIEW public.dresses_public AS
SELECT id, title, category, tilet, neighborhood, distance_km, fee, retail, deposit, rating,
       photos, size, bust, waist, hip, length, description, blocked, status, created_at
FROM public.dresses
WHERE status = 'live';

GRANT SELECT ON public.dresses_public TO anon;
GRANT SELECT ON public.dresses_public TO authenticated;
GRANT SELECT ON public.dresses_public TO service_role;

-- 2) Remove public direct access to the base table (owners/admins keep their own policies).
DROP POLICY "Anyone sees live dresses" ON public.dresses;

COMMENT ON COLUMN public.dresses.lender IS 'DEPRECATED: never expose publicly; owner identity hidden until booking';
COMMENT ON COLUMN public.dresses.owner_id IS 'PRIVATE: never expose to public; revealed to counterparty only after booking';