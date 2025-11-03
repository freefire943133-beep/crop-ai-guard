-- Create crop_scans table to store scan history
CREATE TABLE public.crop_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  crop_type TEXT,
  disease_detected TEXT,
  confidence_score DECIMAL(5,2),
  severity TEXT,
  treatment_recommendations TEXT,
  environmental_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crop_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scans" 
ON public.crop_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" 
ON public.crop_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" 
ON public.crop_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans" 
ON public.crop_scans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_crop_scans_updated_at
BEFORE UPDATE ON public.crop_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for crop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-images', 'crop-images', true);

-- Create storage policies
CREATE POLICY "Users can view their own crop images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own crop images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own crop images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own crop images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);