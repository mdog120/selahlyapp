import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

function getFirebaseAdminApp() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Service account key is stored as a base64-encoded JSON string
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountBase64) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. ' +
      'Set it to the base64-encoded contents of your Firebase service account JSON key.'
    );
  }

  const serviceAccount: ServiceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
  );

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// Initialize once and export the messaging instance
const app = getFirebaseAdminApp();
export const adminMessaging = getMessaging(app);
