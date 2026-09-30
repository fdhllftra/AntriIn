import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// @ts-expect-error getReactNativePersistence is only exposed in react-native entrypoint
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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

const databaseId = readEnv('EXPO_PUBLIC_FIREBASE_DATABASE_ID') || undefined;

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