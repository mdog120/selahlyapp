-- Add is_anonymous column to threads and thread_messages tables
ALTER TABLE public.threads ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;
ALTER TABLE public.thread_messages ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;
