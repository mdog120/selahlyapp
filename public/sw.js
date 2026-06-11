// Service Worker for Selahly Lockscreen Web Push Notifications

self.addEventListener('push', function(event) {
  let data = { title: 'Selahly ౨ৎ', body: 'New notification!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Fallback if not JSON
      data = { title: 'Selahly ౨ৎ', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/logo-v2.svg',
    badge: '/logo-v2.svg',
    data: {
      url: data.url || '/home'
    },
    // Optional: vibration pattern for Android lockscreens
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open Sanctuary' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  let clickUrl = '/home';
  if (event.notification.data && event.notification.data.url) {
    clickUrl = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // If a window is already open, focus it and redirect
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'navigate', url: clickUrl });
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
