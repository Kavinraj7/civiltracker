import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getActiveFirebaseConfig(): FirebaseClientConfig | null {
  // 1. Check local storage override if user provided keys via UI
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('civil_firebase_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse localStorage Firebase config', e);
      }
    }
  }

  // 2. Check environment variables
  const envConfig: FirebaseClientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase() {
  const config = getActiveFirebaseConfig();
  if (!config) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db, isConfigured: true };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { app: null, auth: null, db: null, isConfigured: false };
  }
}

export async function createFirebaseAuthUser(
  email: string,
  pass: string
): Promise<{ success: boolean; uid?: string; error?: string }> {
  const config = getActiveFirebaseConfig();
  if (!config?.apiKey) {
    return { success: false, error: 'Firebase API key is not configured in .env.local.' };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: pass.trim(),
          returnSecureToken: false,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error?.message || '';
      if (msg.includes('EMAIL_EXISTS')) {
        return { success: false, error: 'This email is already registered in Firebase Authentication.' };
      }
      if (msg.includes('WEAK_PASSWORD')) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }
      if (msg.includes('INVALID_EMAIL')) {
        return { success: false, error: 'The email address format is invalid.' };
      }
      return { success: false, error: data.error?.message || 'Firebase Authentication failed.' };
    }

    return { success: true, uid: data.localId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to Firebase Authentication.' };
  }
}

export { app, auth, db };

