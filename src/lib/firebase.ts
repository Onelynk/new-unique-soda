import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

export const TARGET_FIREBASE_PROJECT_ID = 'unique-soda';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Resolves Firebase configuration strictly from environment variables.
 * LocalStorage overrides (nu_firebase_config_v1) are removed.
 * Validates that projectId is EXACTLY 'unique-soda'.
 */
export function getResolvedFirebaseConfig(): FirebaseClientConfig {
  // Purge any legacy localStorage override to enforce pure environment configuration
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('nu_firebase_config_v1');
    } catch (e) {
      // Ignore storage errors in restricted contexts
    }
  }

  const rawEnvProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();

  // Validate that projectId is exactly unique-soda
  if (rawEnvProjectId && rawEnvProjectId !== TARGET_FIREBASE_PROJECT_ID) {
    console.error(
      `[Firebase Security] Invalid projectId "${rawEnvProjectId}". Only "${TARGET_FIREBASE_PROJECT_ID}" is permitted.`
    );
  }

  const projectId = TARGET_FIREBASE_PROJECT_ID;
  const apiKey = (
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyBJIOFrcL2qE_FY7O5_5rIPmiaRXLWkL-U'
  ).trim();
  const authDomain = (
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    `${projectId}.firebaseapp.com`
  ).trim();
  const storageBucket = (
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.firebasestorage.app`
  ).trim();
  const messagingSenderId = (
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    '226831322614'
  ).trim();
  const appId = (
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:226831322614:web:7e5fce1021c5abd9500bd7'
  ).trim();

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

const resolvedConfig = getResolvedFirebaseConfig();

/**
 * Checks whether valid Firebase project environment variables are present and projectId is exactly unique-soda.
 */
export const isFirebaseConfigured: boolean = Boolean(
  resolvedConfig.projectId === TARGET_FIREBASE_PROJECT_ID &&
  resolvedConfig.apiKey &&
  !resolvedConfig.apiKey.includes('MY_') &&
  resolvedConfig.apiKey !== ''
);

export const app: FirebaseApp | null = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(resolvedConfig))
  : null;

export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const auth: Auth | null = app ? getAuth(app) : null;


