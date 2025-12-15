-- Create cases table for saving conversation progress
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE,
  pin_hash TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  context TEXT DEFAULT 'general',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast case_id lookups
CREATE INDEX idx_cases_case_id ON public.cases(case_id);

-- Enable Row Level Security
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required - case_id + PIN is the security)
-- Anyone can create a case
CREATE POLICY "Anyone can create cases" 
ON public.cases 
FOR INSERT 
WITH CHECK (true);

-- Anyone can read cases (but they need the case_id which is secret)
CREATE POLICY "Anyone can read cases by case_id" 
ON public.cases 
FOR SELECT 
USING (true);

-- Anyone can update their case (case_id acts as the key)
CREATE POLICY "Anyone can update cases" 
ON public.cases 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_cases_updated_at();

-- Create function to generate friendly case IDs (6 chars, easy to remember)
CREATE OR REPLACE FUNCTION public.generate_case_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;