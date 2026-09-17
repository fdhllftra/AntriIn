import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  createUserProfile,
  getUserProfile,
} from '../services/firestore';
import { UserProfile } from '../types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setIsSigningIn(true);
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then(async (userCredential) => {
            const fbUser = userCredential.user;
            const existingProfile = await getUserProfile(fbUser.uid);
            if (!existingProfile) {
              await createUserProfile(fbUser.uid, {
                name: fbUser.displayName || 'Pengguna',
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || undefined,
                role: 'customer',
              });
            }
            setAuthError(null);
          })
          .catch((error: Error) => {
            console.error('Google credential sign-in error:', error);
            setAuthError(
              'Autentikasi Gagal, silakan coba lagi.'
            );
          })
          .finally(() => {
            setIsSigningIn(false);
          });
      }
    } else if (response?.type === 'error') {
      setAuthError('Autentikasi Gagal, silakan coba lagi.');
    }
  }, [response]);

  const signInWithGoogle = async (): Promise<void> => {
    setAuthError(null);
    if (!GOOGLE_WEB_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID) {
      setAuthError(
        'Konfigurasi Google Sign-In belum lengkap. Pastikan file .env sudah diisi.'
      );
      return;
    }
    setIsSigningIn(true);
    try {
      const result = await promptAsync();
      if (result?.type !== 'success') {
        setIsSigningIn(false);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthError('Autentikasi Gagal, silakan coba lagi.');
      setIsSigningIn(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  const clearAuthError = () => setAuthError(null);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        isSigningIn,
        authError,
        signInWithGoogle,
        signOut,
        clearAuthError,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};