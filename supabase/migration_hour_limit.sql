-- Add monthly hours limit to profiles
alter table profiles 
add column if not exists monthly_hours_limit integer default 32;

-- Update existing profiles (optional, but good practice to ensure consistency)
update profiles set monthly_hours_limit = 32 where monthly_hours_limit is null;
