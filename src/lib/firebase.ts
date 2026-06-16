import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { createClient } from '@/lib/supabase/client';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton)
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get messaging instance (only works in browser)
let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser.');
    return null;
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseApp);
  }

  return messagingInstance;
}

/**
 * Request notification permission, get FCM token, and save it to Supabase.
 * Returns the token string if successful, null otherwise.
 */
export async function registerAndSaveFCMToken(): Promise<string | null> {
  try {
    // 1. Check browser support
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 2. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied.');
      return null;
    }

    // 3. Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 4. Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn('Failed to get FCM token.');
      return null;
    }

    // 5. Save token to Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user — cannot save FCM token.');
      return null;
    }

    // Upsert: insert or update if this token already exists for this user
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: user.id,
          token: token,
          platform: 'web',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      console.error('Error saving FCM token to Supabase:', error);
    } else {
      console.log('FCM token saved successfully.');
    }

    return token;
  } catch (err) {
    console.error('Error registering FCM token:', err);
    return null;
  }
}

export { firebaseApp };
