# AntriIn

Aplikasi mobile booking barbershop (single-tenant) yang memungkinkan pelanggan memesan jadwal potong rambut secara online tanpa harus menunggu antrean fisik, serta membantu pemilik barbershop mengelola antrean harian.

Tech stack: **React Native + Expo (SDK 57) + TypeScript + Firebase (Auth + Cloud Firestore)**.

## Fitur

- Login Google (expo-auth-session + Firebase credentials)
- Katalog layanan & harga
- Booking engine: pilih layanan, kapster, tanggal, jam
- Validasi ketersediaan slot real-time (slot terisi / ditutup tidak dapat dipilih)
- E-Ticket digital dengan QR code
- Riwayat booking + pembatalan booking oleh pelanggan
- Review & rating kapster setelah layanan selesai
- Dashboard admin: antrean per tanggal, update status (Selesai/Batal), block/unblock slot
- Hubungi via WhatsApp (deep link `wa.me`) dari E-Ticket & dashboard

## Struktur

```
apps/
├── App.tsx                 # Root: AuthProvider + navigasi
├── firestore.rules         # Security rules Firestore
├── scripts/seed-data.js    # Seed layanan & kapster
└── src/
    ├── components/         # Button, Card, Badge
    ├── constants/          # colors, typography, layout
    ├── contexts/           # AuthContext
    ├── navigation/         # Root, Customer, Admin, BookingStack, types
    ├── screens/            # auth, customer, admin
    ├── services/           # firebase.ts, firestore.ts
    ├── types/              # domain models
    └── utils/              # format, dates, whatsapp
```

## Setup

1. Install dependensi

```bash
cd apps
npm install
```

2. Isi `.env` (copy dari `.env.example`) dengan config Firebase & Google OAuth. Semua key wajib:

| Key | Deskripsi |
|-----|-----------|
| `EXPO_PUBLIC_FIREBASE_*` | Config project Firebase |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | OAuth client ID web (dipakai Expo Go) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | OAuth client ID Android |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | OAuth client ID iOS |
| `EXPO_PUBLIC_SHOP_OPEN_HOUR` | Jam buka (default 10) |
| `EXPO_PUBLIC_SHOP_CLOSE_HOUR` | Jam tutup (default 21) |
| `EXPO_PUBLIC_BOOKING_INTERVAL_MINUTES` | Interval slot (default 30) |
| `EXPO_PUBLIC_WHATSAPP_NUMBER` | Nomor WA barbershop (awali kode negara) |

3. Firebase Console (wajib sebelum run):

- Activekan sign-in method **Google** (Authentication > Sign-in method)
- Buat app **Android** & **iOS** (untuk OAuth client IDs + SHA-1)
- Deploy rules: `firebase deploy --only firestore:rules` (pakai `firestore.rules`)
- Buat dokumen `users/{UID}` untuk akun admin dengan field `role: "admin"`

4. Seed data awal layanan & kapster:

```bash
set FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\to\service-account.json
npm run seed
```

## Menjalankan

```bash
npm run start        # Expo dev server
npm run typecheck    # cek TypeScript (0 error)
```

## Git

- Repo git hanya ada di `apps/`. Jangan `git init` di root.
- Semua kerja di branch `dev`. Merge ke `main` mengikuti aturan di `ai-rules/AGENTS.md` (output folder dikecualikan saat merge).