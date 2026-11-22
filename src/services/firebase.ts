import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, Auth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

const databaseId = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_ID || undefined;

const isConfigComplete =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (isConfigComplete) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

    // `getReactNativePersistence` hanya tersedia di entrypoint react-native.
    // Diakses lewat namespace agar tidak menghasilkan error TS/import saat
    // resolusi bundle memilih entrypoint browser (mis. untuk web).
    const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence as
      | ((storage: typeof ReactNativeAsyncStorage) => unknown)
      | undefined;

    if (getReactNativePersistence) {
      try {
        auth = FirebaseAuth.initializeAuth(app, {
          persistence: getReactNativePersistence(
            ReactNativeAsyncStorage
          ) as FirebaseAuth.Persistence,
        });
      } catch (error) {
        // Auth bisa sudah terinisialisasi (Fast Refresh / modul lain).
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }

    db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  } else {
    console.log('[Firebase] Berjalan dalam mode database lokal (AsyncStorage).');
  }
} catch (error) {
  console.warn('[Firebase] Inisialisasi Firebase dilewati:', error);
}

export { app, auth, db };
