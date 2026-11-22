import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
  initializeLocalDatabase,
  getLocalUserProfile,
} from '../services/localDatabase';
import { UserProfile, UserRole } from '../types';
import { subscribeToUserProfile } from '../services/realtime';
import {
  clearPhoneOtp,
  getPhoneAuthCredentials,
  getPhoneAuthEmail,
  issuePhoneOtp,
  toE164PhoneNumber,
  verifyPhoneOtp,
} from '../services/phoneAuth';

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = '@antriin_session_v2';

// Whitelist admin berdasarkan claim Firebase Auth yang terverifikasi.
// Phone: 083832848640 -> E.164 +6283832848640 (hanya ada setelah OTP SMS sukses).
// Email: harus terverifikasi agar orang lain tidak bisa mendaftarkan email ini.
const ADMIN_PHONE_E164 = '+6283832848640';
// Akun Firebase turunan nomor admin (dipakai karena Phone Auth bawaan tidak
// tersedia di Expo Go). Harus sama dengan whitelist di firestore.rules.
const ADMIN_PHONE_EMAIL = getPhoneAuthEmail(ADMIN_PHONE_E164);
const ADMIN_EMAIL = 'hanabi.maniac1@gmail.com';

const isPhoneAuthEmail = (email: string): boolean =>
  email.trim().toLowerCase().endsWith('@antriin.phone');

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

const isValidGoogleClientId = (id: string) =>
  Boolean(id && id.trim().length > 10 && id.includes('googleusercontent.com'));

export const hasValidGoogleConfig =
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
  hasValidGoogleConfig: boolean;
  /** Kode OTP yang baru dibuat; ditampilkan di UI karena Expo Go tanpa SMS gateway. */
  phoneOtp: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  requestWhatsAppCode: (phone: string) => Promise<void>;
  verifyWhatsAppCode: (code: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfilePhoto: (photoURL: string | null) => Promise<void>;
  clearAuthError: () => void;
}

interface PendingPhoneLogin {
  phoneNumber: string;
}

let phoneConfirmation: PendingPhoneLogin | null = null;
let profileUnsubscribe: (() => void) | null = null;

const getErrorMessage = (error: any): string => {
  switch (error?.code || '') {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email atau password salah.';
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.';
    case 'auth/weak-password':
      return 'Password terlalu lemah (minimal 6 karakter).';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';
    case 'auth/argument-error':
      return 'Autentikasi gagal. Periksa kembali data yang Anda masukkan.';
    case 'auth/operation-not-allowed':
      return 'Metode login ini belum diaktifkan di Firebase Console.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Silakan coba beberapa saat lagi.';
    default:
      return error?.message || 'Terjadi kesalahan autentikasi.';
  }
};

const getPhoneErrorMessage = (error: any): string => {
  switch (error?.code || '') {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Nomor atau kode OTP tidak valid. Silakan minta kode baru.';
    case 'auth/argument-error':
      return 'Autentikasi gagal. Silakan coba lagi.';
    case 'auth/invalid-phone-number':
      return 'Nomor telepon tidak valid.';
    case 'auth/operation-not-allowed':
      return 'Login dengan nomor telepon belum diaktifkan di Firebase Console.';
    case 'auth/invalid-app-credential':
    case 'auth/app-not-authorized':
    case 'auth/captcha-check-failed':
      return 'Verifikasi reCAPTCHA belum dikonfigurasi. Aktifkan reCAPTCHA Enterprise mode Enforce di Firebase Console.';
    case 'auth/invalid-verification-code':
      return 'Kode OTP salah. Silakan coba lagi.';
    case 'auth/code-expired':
      return 'Kode OTP kedaluwarsa. Silakan minta kode baru.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Silakan coba beberapa saat lagi.';
    default:
      return error?.message || 'Autentikasi gagal, silakan coba lagi.';
  }
};

/**
 * Peran admin hanya berasal dari identitas yang diverifikasi Firebase Auth,
 * bukan dari AsyncStorage atau input klien. Ini sejalan dengan firestore.rules.
 */
const isDesignatedAdminUser = (fbUser: FirebaseUser): boolean => {
  // Perbandingan harus eksak seperti `request.auth.token.email` di firestore.rules.
  // Jika dibedakan casing, UI bisa menganggap admin sementara rules menolak.
  const verifiedEmail = fbUser.email === ADMIN_EMAIL && fbUser.emailVerified;
  const phoneIdentity = fbUser.email === ADMIN_PHONE_EMAIL;
  return fbUser.phoneNumber === ADMIN_PHONE_E164 || phoneIdentity || verifiedEmail;
};

/** Pertahankan admin yang ditetapkan server, atau naikkan whitelist menjadi admin. */
const resolveRole = (fbUser: FirebaseUser, currentRole?: UserRole | null): UserRole => {
  if (currentRole === 'admin' || isDesignatedAdminUser(fbUser)) return 'admin';
  return 'customer';
};

/** Samakan role profil dengan claim Firebase Auth sebelum dipakai UI. */
const withResolvedRole = (fbUser: FirebaseUser, profile: UserProfile): UserProfile => {
  const role = resolveRole(fbUser, profile.role);
  return role === profile.role ? profile : { ...profile, role };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [phoneOtp, setPhoneOtp] = useState<string | null>(null);

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
      await initializeLocalDatabase().catch(() => {});

      // Mode tanpa Firebase hanya memulihkan sesi lokal yang sudah ada.
      // Mode Firebase selalu memakai onAuthStateChanged + profil dari Firestore
      // agar peran tidak bisa dimanipulasi dari penyimpanan lokal perangkat.
      if (!auth) {
        try {
          const savedSession = await AsyncStorage.getItem(SESSION_KEY);
          if (savedSession && isMounted) {
            const parsed = JSON.parse(savedSession);
            setUser(parsed.user);
            // Tanpa Firebase tidak ada identitas terverifikasi: jangan percaya role
            // yang tersimpan di AsyncStorage (bisa diubah oleh pengguna perangkat).
            setProfile(parsed.profile ? { ...parsed.profile, role: 'customer' as const } : null);
          }
        } catch (e) {
          console.warn('Gagal membaca sesi tersimpan:', e);
        }
        if (isMounted) setIsLoading(false);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
        setUser(firebaseUser);
        if (firebaseUser) {
          // Segarkan status verifikasi email dan klaim token sebelum peran
          // ditentukan. Tanpa ini, verifikasi yang terjadi saat aplikasi terbuka
          // baru terlihat setelah sign out/sign in.
          try {
            await firebaseUser.reload();
            await firebaseUser.getIdToken(true);
          } catch (refreshError) {
            console.warn('Gagal menyegar status autentikasi:', refreshError);
          }

          try {
            const remoteProfile = await getUserProfile(firebaseUser.uid);
            if (remoteProfile) {
              setProfile(withResolvedRole(firebaseUser, remoteProfile));
            } else {
              // Akun yang dibuat langsung di Firebase Console belum punya profil.
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Pengguna',
                email: firebaseUser.email || '',
                phone: firebaseUser.phoneNumber || undefined,
                role: resolveRole(firebaseUser),
                createdAt: Date.now(),
              };
              await createUserProfile(firebaseUser.uid, newProfile);
              setProfile(newProfile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setProfile(null);
          }

          // Profil (termasuk peran) mengikuti perubahan Firestore secara realtime.
          profileUnsubscribe = subscribeToUserProfile(firebaseUser.uid, (updated) => {
            if (isMounted) {
              setProfile(updated ? withResolvedRole(firebaseUser, updated) : null);
            }
          });
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
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }
      unsubPromise.then((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  useEffect(() => {
    if (response?.type !== 'success' || !auth) return;

    const idToken =
      response.params?.id_token ||
      (response as any).authentication?.idToken;

    if (!idToken) {
      setAuthError('Autentikasi Google gagal, silakan coba lagi.');
      return;
    }

    setIsSigningIn(true);
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(auth, credential)
      .then(async (userCredential) => {
        const fbUser = userCredential.user;
        let userProfile = await getUserProfile(fbUser.uid);
        if (!userProfile) {
          userProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || 'Pengguna Google',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || undefined,
            role: resolveRole(fbUser),
            createdAt: Date.now(),
          };
          await createUserProfile(fbUser.uid, userProfile);
        } else {
          userProfile = withResolvedRole(fbUser, userProfile);
        }
        setUser(fbUser);
        setProfile(userProfile);
        setAuthError(null);
      })
      .catch(() => {
        setAuthError('Autentikasi Google gagal, silakan coba lagi.');
      })
      .finally(() => {
        setIsSigningIn(false);
      });
  }, [response]);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Email dan password wajib diisi.');
      return;
    }
    if (isPhoneAuthEmail(trimmedEmail)) {
      setAuthError('Akun nomor WhatsApp hanya bisa dimasuki lewat tab WhatsApp.');
      return;
    }
    if (!auth) {
      setAuthError('Autentikasi tidak tersedia. Periksa konfigurasi Firebase.');
      return;
    }

    setIsSigningIn(true);
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
          role: resolveRole(fbUser),
          createdAt: Date.now(),
        };
        await createUserProfile(fbUser.uid, userProfile);
      } else {
        userProfile = withResolvedRole(fbUser, userProfile);
      }
      setProfile(userProfile);
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: fbUser, profile: userProfile })
      );
    } catch (error: any) {
      setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string
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
    if (isPhoneAuthEmail(trimmedEmail)) {
      setAuthError('Email ini digunakan untuk akun nomor WhatsApp. Gunakan tab WhatsApp.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password minimal 6 karakter.');
      return;
    }
    if (!auth) {
      setAuthError('Autentikasi tidak tersedia. Periksa konfigurasi Firebase.');
      return;
    }

    setIsSigningIn(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      const fbUser = userCredential.user;
      await updateFirebaseProfile(fbUser, { displayName: trimmedName }).catch(() => {});
      const userProfile: UserProfile = {
        uid: fbUser.uid,
        name: trimmedName,
        email: fbUser.email || trimmedEmail,
        // Email baru belum terverifikasi, jadi belum bisa menjadi admin.
        role: resolveRole(fbUser),
        createdAt: Date.now(),
      };
      await createUserProfile(fbUser.uid, userProfile);
      // Verifikasi email wajib agar whitelist email tidak bisa disalahgunakan.
      await sendEmailVerification(fbUser).catch(() => {});
      setUser(fbUser);
      setProfile(userProfile);
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: fbUser, profile: userProfile })
      );
    } catch (error: any) {
      setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const requestWhatsAppCode = async (phone: string): Promise<void> => {
    setAuthError(null);
    const phoneNumber = toE164PhoneNumber(phone);
    if (!phoneNumber) {
      setAuthError('Nomor WhatsApp tidak valid.');
      return;
    }
    if (!auth) {
      setAuthError('Autentikasi tidak tersedia. Periksa konfigurasi Firebase.');
      return;
    }

    setIsSigningIn(true);
    try {
      // Expo Go tidak bisa memakai Phone Auth bawaan Firebase (butuh reCAPTCHA).
      // OTP dibuat lokal, lalu akun Firebase turunan nomor dipakai untuk masuk.
      const code = await issuePhoneOtp(phoneNumber);
      phoneConfirmation = { phoneNumber };
      setPhoneOtp(code);
      setAuthError(null);
    } catch (error) {
      phoneConfirmation = null;
      setPhoneOtp(null);
      setAuthError('Gagal membuat kode OTP. Silakan coba lagi.');
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const verifyWhatsAppCode = async (code: string, name?: string): Promise<void> => {
    setAuthError(null);
    const cleanCode = code.trim();
    if (!phoneConfirmation) {
      setAuthError('Kode OTP belum dikirim. Silakan minta kode baru.');
      return;
    }
    if (!/^\d{6}$/.test(cleanCode)) {
      setAuthError('Kode OTP harus terdiri dari 6 digit angka.');
      return;
    }
    if (!auth) {
      setAuthError('Autentikasi tidak tersedia. Periksa konfigurasi Firebase.');
      return;
    }

    setIsSigningIn(true);
    try {
      const verification = await verifyPhoneOtp(phoneConfirmation.phoneNumber, cleanCode);
      if (!verification.ok) {
        const message =
          verification.reason === 'expired'
            ? 'Kode OTP kedaluwarsa. Silakan minta kode baru.'
            : verification.reason === 'attempts'
              ? 'Terlalu banyak percobaan. Silakan minta kode baru.'
              : verification.reason === 'missing'
                ? 'Kode OTP belum dikirim. Silakan minta kode baru.'
                : 'Kode OTP salah. Silakan coba lagi.';
        setAuthError(message);
        throw new Error(message);
      }

      const credentials = await getPhoneAuthCredentials(phoneConfirmation.phoneNumber);
      let fbUser: FirebaseUser;
      try {
        fbUser = (
          await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
        ).user;
      } catch (signInError: any) {
        const isNewUser =
          signInError?.code === 'auth/user-not-found' ||
          signInError?.code === 'auth/invalid-credential';
        if (!isNewUser) throw signInError;
        fbUser = (
          await createUserWithEmailAndPassword(auth, credentials.email, credentials.password)
        ).user;
      }

      const displayName = name?.trim() || fbUser.displayName || 'Pelanggan';
      await updateFirebaseProfile(fbUser, { displayName }).catch(() => {});

      let userProfile = await getUserProfile(fbUser.uid);
      if (!userProfile) {
        userProfile = {
          uid: fbUser.uid,
          name: displayName,
          email: credentials.email,
          phone: phoneConfirmation.phoneNumber,
          role: resolveRole(fbUser),
          createdAt: Date.now(),
        };
        await createUserProfile(fbUser.uid, userProfile);
      } else if (userProfile.phone !== phoneConfirmation.phoneNumber) {
        // Pastikan nomor yang diverifikasi ikut tersimpan di Firestore.
        userProfile = { ...userProfile, phone: phoneConfirmation.phoneNumber };
        await updateUserProfile(fbUser.uid, { phone: phoneConfirmation.phoneNumber });
      }
      userProfile = withResolvedRole(fbUser, userProfile);

      setUser(fbUser);
      setProfile(userProfile);
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: fbUser, profile: userProfile })
      );
      phoneConfirmation = null;
      setPhoneOtp(null);
      setAuthError(null);
    } catch (error: any) {
      setAuthError(getPhoneErrorMessage(error));
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setAuthError(null);

    if (Platform.OS === 'web' && auth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
        return;
      } catch (error: any) {
        if (error?.code === 'auth/popup-closed-by-user') return;
        setAuthError(getErrorMessage(error));
        return;
      }
    }

    if (hasValidGoogleConfig) {
      const result = await promptAsync();
      if (result?.type !== 'success') {
        setAuthError('Autentikasi Google dibatalkan atau gagal.');
      }
      return;
    }

    setAuthError('Google Sign-In belum dikonfigurasi. Periksa client ID di .env.');
  };

  const signOut = async (): Promise<void> => {
    try {
      phoneConfirmation = null;
      await clearPhoneOtp().catch(() => {});
      setPhoneOtp(null);
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

      const role = auth?.currentUser
        ? resolveRole(auth.currentUser, profile?.role)
        : profile?.role ?? 'customer';
      const updatedProfile: UserProfile = profile
        ? { ...profile, photoURL: cleanPhoto || undefined, role }
        : {
            uid: user.uid,
            name: user.displayName || 'Pengguna',
            email: user.email || '',
            role,
            photoURL: cleanPhoto || undefined,
          };

      await updateUserProfile(user.uid, { photoURL: cleanPhoto || '' });
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user: updatedUser, profile: updatedProfile })
      );

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
        hasValidGoogleConfig,
        phoneOtp,
        signInWithEmail,
        signUpWithEmail,
        requestWhatsAppCode,
        verifyWhatsAppCode,
        signInWithGoogle,
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
