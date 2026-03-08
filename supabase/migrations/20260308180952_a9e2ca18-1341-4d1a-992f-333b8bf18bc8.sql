UPDATE storage.buckets SET public = false WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;