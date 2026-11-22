/**
 * Seed data awal untuk AntriIn (Firestore)
 *
 * Prerequisite:
 *  1. Install firebase-admin (sudah di devDependencies)
 *  2. Download service account JSON dari Firebase Console
 *     (Project Settings > Service accounts > Generate new private key)
 *  3. Set env FIREBASE_SERVICE_ACCOUNT_PATH ke path file JSON tersebut
 *  4. Jalankan: npm run seed
 *
 * Catatan: scripts/ TIDAK di-deploy ke perangkat. Data layanan & kapster
 * juga bisa diisi manual via Firebase Console (collection 'services' & 'barbers').
 */
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error(
    'ERROR: Set env FIREBASE_SERVICE_ACCOUNT_PATH dulu, contoh:\n' +
      '  set FIREBASE_SERVICE_ACCOUNT_PATH=C:\\path\\to\\service-account.json\n' +
      '  npm run seed'
  );
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
} catch (err) {
  console.error('Gagal inisialisasi Firebase Admin:', err.message);
  process.exit(1);
}

const db = admin.firestore();

const SERVICES = [
  {
    name: 'Cukur Rapi',
    description: 'Potong rambut rapi sesuai permintaan',
    price: 30000,
    durationMinutes: 30,
    isActive: true,
  },
  {
    name: 'Cukur + Cuci',
    description: 'Potong rambut plus cuci dengan pijat kepala',
    price: 40000,
    durationMinutes: 45,
    isActive: true,
  },
  {
    name: 'Cukur + Cuci + Creambath',
    description: 'Paket lengkap perawatan rambut',
    price: 60000,
    durationMinutes: 60,
    isActive: true,
  },
  {
    name: 'Cuci Rambut',
    description: 'Cuci rambut quick service',
    price: 15000,
    durationMinutes: 15,
    isActive: true,
  },
];

const BARBERS = [
  {
    name: 'Bang Edi',
    specialty: 'Master Barber',
    isActive: true,
  },
  {
    name: 'Kang Rizky',
    specialty: 'Beard & Fade Specialist',
    isActive: true,
  },
  {
    name: 'Mas Yoga',
    specialty: 'Kids & Student Cut',
    isActive: true,
  },
];

async function seed() {
  const now = Date.now();
  const batch = db.batch();

  for (const service of SERVICES) {
    const ref = db.collection('services').doc();
    batch.set(ref, { ...service, createdAt: now });
    console.log('Service (planned):', service.name, '-', service.price);
  }

  for (const barber of BARBERS) {
    const ref = db.collection('barbers').doc();
    batch.set(ref, { ...barber, createdAt: now });
    console.log('Barber (planned):', barber.name);
  }

  await batch.commit();
  console.log('\nSeed selesai. Data layanan & kapster berhasil ditambahkan.');
  console.log(
    '\nLangkah tambahan:',
    '\n  1. Deploy firestore.rules (lihat dev-docs/FIREBASE_DEPLOY.md).',
    '\n  2. Admin WhatsApp/email cukup login dengan akun terverifikasi; peran berasal',
    '\n     dari claim Firebase Auth, bukan field role yang ditulis klien.'
  );
}

seed().catch((err) => {
  console.error('Seed gagal:', err.message);
  process.exit(1);
});