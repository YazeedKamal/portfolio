-- Allow video hero covers in the `project-images` bucket.
-- The bucket was created without an explicit `file_size_limit`, so it fell back
-- to the project default (commonly 50 MB) and only ever received compressed
-- images. Now that hero/card covers can be videos, raise the ceiling to 100 MB
-- and whitelist the same video mime types the uploader accepts (`MEDIA_ACCEPT`
-- / `MAX_MEDIA_BYTES` in lib/upload-media.ts — keep these in sync).
update storage.buckets
set
  file_size_limit = 104857600, -- 100 MB
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'project-images';
