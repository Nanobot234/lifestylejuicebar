CREATE TABLE public.event_inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  event_type text,
  preferred_date date,
  guest_count text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.event_inquiries TO anon;
GRANT SELECT, INSERT ON public.event_inquiries TO authenticated;
GRANT ALL ON public.event_inquiries TO service_role;

ALTER TABLE public.event_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an event inquiry"
ON public.event_inquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Business owners can view event inquiries"
ON public.event_inquiries FOR SELECT TO authenticated
USING (public.is_business_owner(auth.uid()));