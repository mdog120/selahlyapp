// Firebase Messaging Service Worker
// This runs in the background and handles push notifications when the app is closed

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values must match your Firebase project config
firebase.initializeApp({
  apiKey: 'AIzaSyAkvFnmCsiVtNkYkRYoVtPzH12zWX-PYbQ',
  authDomain: 'selahly-mobile.firebaseapp.com',
  projectId: 'selahly-mobile',
  storageBucket: 'selahly-mobile.firebasestorage.app',
  messagingSenderId: '463669249072',
  appId: '1:463669249072:web:fb45699efd0e0b5b92d9f5',
});

const messaging = firebase.messaging();

// Handle background messages (when app/tab is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Selahly ౨ৎ';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/logo-v2.svg',
    badge: '/brand-icon-v2.png',
    tag: payload.data?.type || 'general',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the relevant page
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/home';

  // Route to the relevant page based on notification type
  switch (data.type) {
    case 'like':
    case 'comment':
    case 'comment_like':
    case 'post':
      targetUrl = '/home';
      break;
    case 'reply':
      targetUrl = data.resource_id ? `/velvet-vault/${data.resource_id}` : '/velvet-vault';
      break;
    case 'pray':
    case 'prayer':
    case 'prayer_request':
      targetUrl = '/prayer-pocket';
      break;
    case 'friend_request':
      targetUrl = '/profile/me';
      break;
    case 'message':
    case 'message_like':
    case 'message_dislike':
      targetUrl = data.actor_id ? `/messages/${data.actor_id}` : '/messages';
      break;
    case 'group_message_like':
    case 'group_message_dislike':
      targetUrl = data.resource_id ? `/messages/group/${data.resource_id}` : '/messages';
      break;
    case 'mention':
      if (data.resource_type === 'group_chat' && data.resource_id) {
        targetUrl = `/messages/group/${data.resource_id}`;
      } else {
        targetUrl = '/home';
      }
      break;
    case 'plant_ready':
    case 'solo_minigame':
      targetUrl = '/minigames';
      break;
    case 'lobby':
      targetUrl = '/minigames/multiplayer';
      break;
    case 'verse_of_the_day':
      targetUrl = '/diaries';
      break;
    default:
      targetUrl = '/home';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    })
  );
});
