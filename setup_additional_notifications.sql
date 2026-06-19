-- 1. Trigger for Game Rooms (Multiplayer Lobby Presence)
CREATE OR REPLACE FUNCTION handle_new_game_room_notification() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a notification for every friend of the host
  INSERT INTO public.notifications (user_id, actor_id, type, resource_id, resource_type, created_at)
  SELECT 
    CASE 
      WHEN friendships.user_id_1 = NEW.host_id THEN friendships.user_id_2 
      ELSE friendships.user_id_1 
    END AS user_id,
    NEW.host_id AS actor_id,
    'lobby' AS type,
    NEW.id AS resource_id,
    'lobby' AS resource_type,
    now() AS created_at
  FROM public.friendships friendships
  WHERE (friendships.user_id_1 = NEW.host_id OR friendships.user_id_2 = NEW.host_id)
    AND friendships.status = 'accepted';
    
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_game_room_notification ON public.game_rooms;
CREATE TRIGGER on_new_game_room_notification
  AFTER INSERT ON public.game_rooms
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_game_room_notification();


-- 2. Trigger for Prayer Requests (Someone needs prayer)
CREATE OR REPLACE FUNCTION handle_new_prayer_request_notification() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a notification for every friend of the prayer requester
  INSERT INTO public.notifications (user_id, actor_id, type, resource_id, resource_type, created_at)
  SELECT 
    CASE 
      WHEN friendships.user_id_1 = NEW.user_id THEN friendships.user_id_2 
      ELSE friendships.user_id_1 
    END AS user_id,
    CASE 
      WHEN NEW.is_anonymous = TRUE THEN NULL
      ELSE NEW.user_id
    END AS actor_id,
    'prayer_request' AS type,
    NEW.id AS resource_id,
    'prayer' AS resource_type,
    now() AS created_at
  FROM public.friendships friendships
  WHERE (friendships.user_id_1 = NEW.user_id OR friendships.user_id_2 = NEW.user_id)
    AND friendships.status = 'accepted';
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_prayer_request ON public.prayers;
CREATE TRIGGER on_new_prayer_request
  AFTER INSERT ON public.prayers
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_prayer_request_notification();


-- 3. Update the push webhook function to include the notification ID in payload
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
  -- Build the payload from the new notification row (including ID)
  payload := jsonb_build_object(
    'id', NEW.id,
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
