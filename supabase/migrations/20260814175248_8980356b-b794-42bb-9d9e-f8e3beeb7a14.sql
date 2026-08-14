-- Bundled local assets: jpg/jpeg -> webp
UPDATE public.products
SET image_url = regexp_replace(image_url, '\.(jpg|jpeg)$', '.webp')
WHERE image_url LIKE '/src/assets/%';

-- Hosted storage images now served as bundled webp assets
UPDATE public.products
SET image_url = '/src/assets/' || regexp_replace(split_part(split_part(image_url, '/product-images/', 2), '?', 1), '\.(jpg|jpeg|png)$', '.webp')
WHERE image_url LIKE '%/product-images/%';

-- Unsplash images served as webp
UPDATE public.products
SET image_url = image_url || '&fm=webp'
WHERE image_url LIKE 'https://images.unsplash.com/%' AND image_url NOT LIKE '%fm=webp%';

-- CDN assets replaced with webp uploads
UPDATE public.products SET image_url = '/__l5e/assets-v1/f77e16eb-572f-4c4f-937e-6d6be34cb9ca/avocado-toast.webp' WHERE name = 'Avocado Toast';
UPDATE public.products SET image_url = '/__l5e/assets-v1/621357b6-15ff-4160-b174-d9bfc4bc3f93/fruit-toast.webp' WHERE name = 'Fruit Toast';
UPDATE public.products SET image_url = '/__l5e/assets-v1/5096087e-c4de-42fa-abc0-23e7fad4b1bb/juice-cleanse.webp' WHERE name = 'Juice Cleanse';
UPDATE public.products SET image_url = '/src/assets/toast-pb-berry.webp' WHERE name = 'PB & Berry Toast' AND image_url IS NULL;