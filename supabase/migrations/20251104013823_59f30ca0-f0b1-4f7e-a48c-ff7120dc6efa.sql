-- Make crop-images bucket private for security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'crop-images';