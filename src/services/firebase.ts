import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// @ts-expect-error getReactNativePersistence is only exposed in react-native entrypoint
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
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
    if (getApps().length > 0) {
      app = getApps()[0];
      auth = getAuth(app);
    } else {
      app = initializeApp(firebaseConfig);
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage),
        });
      } catch {
        auth = getAuth(app);
      }
    }
    db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  } else {
    console.log('[Firebase] Berjalan dalam mode database lokal (AsyncStorage).');
  }
} catch (error) {
  console.warn('[Firebase] Inisialisasi Firebase dilewati:', error);
}

export { app, auth, db };