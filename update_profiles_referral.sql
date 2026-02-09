-- Add referral columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_details TEXT; -- store friend's name or other details

-- No RLS update needed as users update their own profile during onboarding and they already have update policy usually.
-- But just in case, ensure update policy allows these columns. 
-- Existing policies likely cover "UPDATE" for "auth.uid() = id".
