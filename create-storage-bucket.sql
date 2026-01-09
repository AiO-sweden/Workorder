-- Create organization logos storage bucket
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos for their organization
CREATE POLICY "Users can upload logos for their organization"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM schedulable_users
    WHERE id = auth.uid()
  )
);

-- Allow authenticated users to update their organization's logo
CREATE POLICY "Users can update their organization's logo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM schedulable_users
    WHERE id = auth.uid()
  )
);

-- Allow everyone to view logos (public bucket)
CREATE POLICY "Public can view logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization-logos');
