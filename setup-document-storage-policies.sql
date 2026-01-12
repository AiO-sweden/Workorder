-- Storage Policies for order-documents bucket
-- Run this in Supabase SQL Editor after creating the bucket

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload order documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy: Allow authenticated users to view/download files
CREATE POLICY "Authenticated users can view order documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy: Allow authenticated users to delete their uploaded files
CREATE POLICY "Authenticated users can delete order documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy: Allow authenticated users to update files
CREATE POLICY "Authenticated users can update order documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'order-documents' AND
  auth.uid() IS NOT NULL
);
