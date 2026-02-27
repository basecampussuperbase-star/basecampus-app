alter table profiles
add column if not exists bio text,
add column if not exists headline text,
add column if not exists website text,
add column if not exists linkedin_url text,
add column if not exists instagram_url text,
add column if not exists whatsapp text;
