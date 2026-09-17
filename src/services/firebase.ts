import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const readEnv = (key: string): string => process.env[key] || '';

const firebaseConfig = {
  apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

// Field yang wajib ada agar Firebase bisa diinisialisasi tanpa exception.
const isConfigComplete =
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.authDomain !== '' &&
  firebaseConfig.projectId !== '';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (isConfigComplete) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn(
      '[Firebase] Konfigurasi .env tidak lengkap (cek EXPO_PUBLIC_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID). Firebase dinonaktifkan.'
    );
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, db };