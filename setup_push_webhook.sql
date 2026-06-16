-- ============================================================
-- STEP 2: Run this AFTER deploying to Vercel
-- Creates a Postgres trigger that calls your push API
-- whenever a new notification is inserted
-- ============================================================

-- Enable pg_net extension (should already be enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function that fires on notification insert
CREATE OR REPLACE FUNCTION notify_push_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  app_url text := 'https://selahlyapp.vercel.app';
  webhook_secret text := 'selahly-push-secret-change-me-to-something-random';
BEGIN
  -- Build the payload from the new notification row
  payload := jsonb_build_object(
    'user_id', NEW.user_id,
    'actor_id', NEW.actor_id,
    'type', NEW.type,
    'resource_id', NEW.resource_id,
    'resource_type', NEW.resource_type
  );

  -- Fire HTTP POST to the push notification API
  PERFORM net.http_post(
    url := app_url || '/api/send-push',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    )
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on the notifications table
DROP TRIGGER IF EXISTS on_notification_send_push ON notifications;
CREATE TRIGGER on_notification_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_on_insert();
