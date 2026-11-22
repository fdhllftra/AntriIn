import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Login WhatsApp untuk Expo Go.
 *
 * Firebase JS SDK v12 tidak bisa menjalankan Phone Auth di Expo Go karena
 * `signInWithPhoneNumber` membutuhkan ApplicationVerifier/reCAPTCHA (DOM).
 * Alur di sini memakai OTP yang dibuat & diverifikasi di perangkat, lalu
 * memakai akun Firebase Auth yang deterministik dari nomor telepon. Nomor
 * pengguna tetap disimpan di Firestore (`users/{uid}.phone`).
 *
 * Catatan: pengiriman OTP ke WhatsApp asli membutuhkan gateway/server. Di Expo
 * Go kode ditampilkan di layar sehingga alur bisa diuji tanpa SMS gateway.
 */

const PHONE_OTP_KEY = '@antriin_phone_otp';
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const PHONE_AUTH_DOMAIN = 'antriin.phone';

export interface PhoneOtpRecord {
  phoneNumber: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export type OtpVerificationResult =
  | { ok: true }
  | { ok: false; reason: 'missing' | 'expired' | 'attempts' | 'mismatch' };

/** Ubah nomor lokal Indonesia menjadi format E.164 (+62...). */
export const toE164PhoneNumber = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  let national = digits;
  if (digits.startsWith('62')) national = digits.slice(2);
  else if (digits.startsWith('0')) national = digits.slice(1);
  if (national.length < 8 || national.length > 14) return null;
  return `+62${national}`;
};

/** Email buatan yang dipakai sebagai identitas Firebase Auth untuk nomor ini. */
export const getPhoneAuthEmail = (phoneNumber: string): string =>
  `phone_${phoneNumber.replace(/\D/g, '')}@${PHONE_AUTH_DOMAIN}`;

/**
 * Password deterministik turunan nomor. Izinkan akun yang sama dipakai lagi di
 * perangkat lain setelah OTP sukses. Secret sebaiknya diset lewat `.env`; nilai
 * bawaan hanya untuk pengembangan.
 */
export const getPhoneAuthCredentials = async (
  phoneNumber: string
): Promise<{ email: string; password: string }> => {
  const secret = process.env.EXPO_PUBLIC_PHONE_AUTH_SECRET || 'antriin-dev-phone-secret';
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${secret}:${phoneNumber}`
  );
  return {
    email: getPhoneAuthEmail(phoneNumber),
    password: `AntriIn!${digest.slice(0, 32)}`,
  };
};

export const issuePhoneOtp = async (phoneNumber: string): Promise<string> => {
  const bytes = Crypto.getRandomBytes(4);
  const random =
    (((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0) %
    1000000;
  const code = String(random).padStart(6, '0');
  const record: PhoneOtpRecord = {
    phoneNumber,
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  };
  await AsyncStorage.setItem(PHONE_OTP_KEY, JSON.stringify(record));
  return code;
};

export const verifyPhoneOtp = async (
  phoneNumber: string,
  code: string
): Promise<OtpVerificationResult> => {
  const raw = await AsyncStorage.getItem(PHONE_OTP_KEY);
  if (!raw) return { ok: false, reason: 'missing' };

  let record: PhoneOtpRecord;
  try {
    record = JSON.parse(raw) as PhoneOtpRecord;
  } catch {
    await clearPhoneOtp();
    return { ok: false, reason: 'missing' };
  }

  if (record.phoneNumber !== phoneNumber) {
    return { ok: false, reason: 'missing' };
  }
  if (typeof record.expiresAt !== 'number' || record.expiresAt < Date.now()) {
    await clearPhoneOtp();
    return { ok: false, reason: 'expired' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: 'attempts' };
  }
  if (record.code !== code) {
    await AsyncStorage.setItem(
      PHONE_OTP_KEY,
      JSON.stringify({ ...record, attempts: record.attempts + 1 })
    );
    return { ok: false, reason: 'mismatch' };
  }

  await clearPhoneOtp();
  return { ok: true };
};

export const clearPhoneOtp = async (): Promise<void> => {
  await AsyncStorage.removeItem(PHONE_OTP_KEY);
};
