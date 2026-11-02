import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from '../services/firestore';
import {
  findLocalUserByPhone,
  getLocalUserProfile,
  saveLocalUserProfile,
  initializeLocalDatabase,
} from '../services/localDatabase';
import { UserProfile, UserRole } from '../types';

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = '@antriin_session_v2';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// Periksa apakah Client ID merupakan OAuth Client ID yang valid (bukan API key)
const isValidGoogleClientId = (id: string) =>
  Boolean(id && id.includes('.googleusercontent.com'));

const hasValidGoogleConfig =
  isValidGoogleClientId(GOOGLE_WEB_CLIENT_ID) ||
  isValidGoogleClientId(GOOGLE_ANDROID_CLIENT_ID) ||
  isValidGoogleClientId(GOOGLE_IOS_CLIENT_ID);

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phone?: string | null;
}

interface AuthContextType {
  user: AppUser | FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  signInWithWhatsApp: (phone: string, name?: string, role?: UserRole) => Promise<void>;
  signInWithGoogle: (customAccount?: { email: string; name: string }) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfilePhoto: (photoURL: string | null) => Promise<void>;
  clearAuthError: () => void;
}

const getErrorMessage = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/user-not-found':
      return 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password salah.';
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.';
    case 'auth/weak-password':
      return 'Password terlalu lemah (minimal 6 karakter).';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';
    case 'auth/operation-not-allowed':
      return 'Fitur Email/Password belum aktif di Firebase Console. Gunakan login WhatsApp atau akun demo.';
    default:
      return error?.message || 'Terjadi kesalahan autentikasi.';
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [, response, promptAsync] = hasValidGoogleConfig
    ? Google.useIdTokenAuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID || undefined,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
        iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
        scopes: ['profile', 'email'],
      })
    : [null, null, async () => ({ type: 'cancel' as const })];

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Inisialisasi basis data lokal
      await initializeLocalDatabase().catch(() => {});

      try {
        const savedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (savedSession && isMounted) {
          const parsed = JSON.parse(savedSession);
          setUser(parsed.user);
          setProfile(parsed.profile);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Gagal membaca sesi tersimpan:', e);
      }

      if (!auth) {
        if (isMounted) setIsLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
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
    };

    const unsubPromise = initAuth();

    return () => {
      isMounted = false;
      unsubPromise.then((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  // Tangani respons Google Auth jika konfigurasi valid
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token && auth) {
        setIsSigningIn(true);
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then(async (userCredential) => {
            const fbUser = userCredential.user;
            let existingProfile = await getUserProfile(fbUser.uid);
            if (!existingProfile) {
              existingProfile = {
                uid: fbUser.uid,
                name: fbUser.displayName || 'Pengguna Google',
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || undefined,
                role: 'customer',
                createdAt: Date.now(),
              };
              await createUserProfile(fbUser.uid, existingProfile);
            }
            setUser(fbUser);
            setProfile(existingProfile);
            await AsyncStorage.setItem(
              SESSION_KEY,
              JSON.stringify({ user: fbUser, profile: existingProfile })
            );
            setAuthError(null);
          })
          .catch((error: Error) => {
            console.error('Google credential sign-in error:', error);
            setAuthError('Autentikasi Google gagal, silakan coba lagi.');
          })
          .finally(() => {
            setIsSigningIn(false);
          });
      }
    } else if (response?.type === 'error') {
      setAuthError('Autentikasi Google dibatalkan atau gagal.');
    }
  }, [response]);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Email dan password wajib diisi.');
      return;
    }

    setIsSigningIn(true);
    try {
      if (auth) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
          const fbUser = userCredential.user;
          setUser(fbUser);
          let userProfile = await getUserProfile(fbUser.uid);
          if (!userProfile) {
            userProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || trimmedEmail.split('@')[0],
              email: fbUser.email || trimmedEmail,
              role: 'customer',
              createdAt: Date.now(),
            };
            await createUserProfile(fbUser.uid, userProfile).catch(() => {});
          }
          setProfile(userProfile);
          await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ user: fbUser, profile: userProfile })
          );
          return;
        } catch (firebaseErr: any) {
          // Jika Firebase operation-not-allowed atau jaringan gagal, cek profil lokal
          console.warn('Firebase signInWithEmail error, checking local profiles:', firebaseErr);
        }
      }

      // Fallback: periksa pengguna lokal
      const localUsers = await (await import('../services/localDatabase')).getLocalUsers();
      const matched = localUsers.find(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );

      if (matched) {
        const appUser: AppUser = {
          uid: matched.uid,
          email: matched.email,
          displayName: matched.name,
          photoURL: matched.photoURL || null,
          phone: matched.phone || null,
        };
        setUser(appUser);
        setProfile(matched);
        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ user: appUser, profile: matched })
        );
        return;
      }

      // Jika tidak ditemukan di lokal dan Firebase gagal
      setAuthError('Email tidak terdaftar atau password salah.');
      throw new Error('User not found');
    } catch (error: any) {
      const msg = getErrorMessage(error);
      setAuthError(msg);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'customer'
  ): Promise<void> => {
    setAuthError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setAuthError('Nama lengkap wajib diisi.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAuthError('Format email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password minimal 6 karakter.');
      return;
    }

    setIsSigningIn(true);
    try {
      const newUid = `user-${Date.now()}`;
      const newProfile: UserProfile = {
        uid: newUid,
        name: trimmedName,
        email: trimmedEmail,
        role,
        createdAt: Date.now(),
      };

      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          const fbUser = userCredential.user;
          await updateFirebaseProfile(fbUser, { displayName: trimmedName }).catch(() => {});
          newProfile.uid = fbUser.uid;
          await createUserProfile(fbUser.uid, newProfile).catch(() => {});
          setUser(fbUser);
          setProfile(newProfile);
          await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ user: fbUser, profile: newProfile })
          );
          return;
        } catch (firebaseErr: any) {
          console.warn('Firebase signUp error, saving user locally:', firebaseErr);
        }
      }

      // Simpan lokal jika Firebase offline atau belum diaktifkan
      await saveLocalUserProfile(newUid, newProfile);
      const appUser: AppUser = {
        uid: newUid,
        email: trimmedEmail,
        displayName: trimmedName,
        photoURL: null,
      };
      setUser(appUser);
      setProfile(newProfile);
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: appUser, profile: newProfile })
      );
    } catch (error: any) {
      const msg = getErrorMessage(error);
      setAuthError(msg);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  // Login dengan nomor WhatsApp
  const signInWithWhatsApp = async (
    phone: string,
    name?: string,
    role: UserRole = 'customer'
  ): Promise<void> => {
    setAuthError(null);
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setAuthError('Nomor WhatsApp minimal 8 digit.');
      return;
    }

    setIsSigningIn(true);
    try {
      // 1. Cek apakah nomor WA sudah pernah ada di database
      let matchedUser = await findLocalUserByPhone(cleanPhone);

      if (!matchedUser) {
        // Buat profil pengguna baru berbasis WhatsApp
        const uid = `wa-${cleanPhone.replace(/\D/g, '') || Date.now()}`;
        const newProfile: UserProfile = {
          uid,
          name: name?.trim() || `Pelanggan WA (${cleanPhone.slice(-4)})`,
          email: `${cleanPhone.replace(/\D/g, '')}@whatsapp.antriin.com`,
          phone: cleanPhone,
          role,
          createdAt: Date.now(),
        };

        matchedUser = await saveLocalUserProfile(uid, newProfile);
        await createUserProfile(uid, matchedUser).catch(() => {});
      }

      const appUser: AppUser = {
        uid: matchedUser.uid,
        email: matchedUser.email,
        displayName: matchedUser.name,
        photoURL: matchedUser.photoURL || null,
        phone: matchedUser.phone || cleanPhone,
      };

      setUser(appUser);
      setProfile(matchedUser);

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: appUser, profile: matchedUser })
      );
    } catch (error: any) {
      console.error('Error WhatsApp login:', error);
      setAuthError('Gagal masuk dengan nomor WhatsApp. Silakan coba lagi.');
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  // Login dengan Google (Mendukung Real OAuth & Expo Go Development Simulator)
  const signInWithGoogle = async (customAccount?: {
    email: string;
    name: string;
  }): Promise<void> => {
    setAuthError(null);
    setIsSigningIn(true);

    try {
      // Jika diberikan akun simulasi pengujian Google untuk Expo Go
      if (customAccount) {
        const uid = `google-${customAccount.email.replace(/[@.]/g, '_')}`;
        let googleProfile = await getLocalUserProfile(uid);

        if (!googleProfile) {
          googleProfile = {
            uid,
            name: customAccount.name,
            email: customAccount.email,
            role: 'customer',
            photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            createdAt: Date.now(),
          };
          await saveLocalUserProfile(uid, googleProfile);
          await createUserProfile(uid, googleProfile).catch(() => {});
        }

        const appUser: AppUser = {
          uid: googleProfile.uid,
          email: googleProfile.email,
          displayName: googleProfile.name,
          photoURL: googleProfile.photoURL || null,
        };

        setUser(appUser);
        setProfile(googleProfile);
        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ user: appUser, profile: googleProfile })
        );
        return;
      }

      // Jika Client ID OAuth Google sudah valid, jalankan flow Google Auth
      if (hasValidGoogleConfig) {
        const result = await promptAsync();
        if (result?.type !== 'success') {
          setIsSigningIn(false);
        }
      } else {
        // Fallback default akun Google untuk kemudahan testing di Expo Go
        const defaultGoogleUser = {
          name: 'Pengguna Google (Expo)',
          email: 'pengguna.google@gmail.com',
        };
        await signInWithGoogle(defaultGoogleUser);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthError('Autentikasi Google gagal.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const loginAsDemo = async (role: UserRole): Promise<void> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const isAdm = role === 'admin';
      const uid = isAdm ? 'demo-admin-01' : 'demo-customer-01';

      // Ambil data dari test-database lokal jika ada
      let demoProfile = await getLocalUserProfile(uid);
      if (!demoProfile) {
        demoProfile = {
          uid,
          name: isAdm ? 'Mas Hendra (Owner Barbershop)' : 'Budi Santoso (Pelanggan Uji Coba)',
          email: isAdm ? 'admin.demo@antriin.com' : 'pelanggan.demo@antriin.com',
          phone: isAdm ? '081298765432' : '081234567890',
          role,
          createdAt: Date.now(),
        };
        await saveLocalUserProfile(uid, demoProfile);
      }

      const demoUser: AppUser = {
        uid: demoProfile.uid,
        displayName: demoProfile.name,
        email: demoProfile.email,
        phone: demoProfile.phone || null,
        photoURL: demoProfile.photoURL || null,
      };

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: demoUser, profile: demoProfile })
      );
      setUser(demoUser);
      setProfile(demoProfile);
    } catch (error) {
      console.error('Error logging in as demo:', error);
      setAuthError('Gagal masuk akun demo.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      if (auth && auth.currentUser) {
        await firebaseSignOut(auth).catch(() => {});
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfilePhoto = async (photoURL: string | null): Promise<void> => {
    if (!user) return;
    try {
      const cleanPhoto = photoURL && photoURL.trim().length > 0 ? photoURL : null;

      const updatedUser: AppUser = {
        uid: user.uid,
        displayName: user.displayName || null,
        email: user.email || null,
        phone: (user as any).phone || null,
        photoURL: cleanPhoto,
      };

      const updatedProfile: UserProfile = profile
        ? {
            ...profile,
            photoURL: cleanPhoto || undefined,
          }
        : {
            uid: user.uid,
            name: user.displayName || 'Pengguna',
            email: user.email || '',
            role: 'customer',
            photoURL: cleanPhoto || undefined,
          };

      // Persist to local database and Firestore
      await updateUserProfile(user.uid, {
        photoURL: cleanPhoto || '',
      });

      // Persist to session storage
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: updatedUser, profile: updatedProfile })
      );

      // Update Firebase Auth if logged in via Firebase
      if (auth && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, {
          photoURL: cleanPhoto || '',
        }).catch(() => {});
      }

      setUser(updatedUser);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile photo:', error);
      throw error;
    }
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
        signInWithEmail,
        signUpWithEmail,
        signInWithWhatsApp,
        signInWithGoogle,
        loginAsDemo,
        signOut,
        updateProfilePhoto,
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