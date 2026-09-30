/**
 * Script Seeder Database AntriIn dari File JSON (test-database.json)
 *
 * Mengimpor seluruh data testing (Layanan, Kapster, Akun Pengguna, Antrean Booking, Review, & Blocked Slots)
 * langsung ke Firebase Firestore.
 *
 * Cara menjalankan:
 *   npm run seed:json
 * atau:
 *   node scripts/seed-from-json.js
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  writeBatch,
} = require('firebase/firestore');

// 1. Baca konfigurasi .env
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ File .env tidak ditemukan di folder apps/.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Konfigurasi Firebase di file .env belum lengkap.');
  process.exit(1);
}

// 2. Baca file JSON Database
const dataPath = path.resolve(__dirname, '../data/test-database.json');
if (!fs.existsSync(dataPath)) {
  console.error('❌ File data/test-database.json tidak ditemukan.');
  process.exit(1);
}

const database = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Helper untuk menghitung tanggal relatif (hari ini, besok, kemarin)
function getDateString(relativeDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + relativeDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runSeed() {
  console.log('🚀 Memulai Seeding Database Testing ke Firebase Firestore...');
  console.log(`📌 Project ID: ${firebaseConfig.projectId}`);

  const app = initializeApp(firebaseConfig);
  const databaseId = env.EXPO_PUBLIC_FIREBASE_DATABASE_ID || undefined;
  if (databaseId) {
    console.log(`📌 Database ID: ${databaseId}`);
  }
  const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  const now = Date.now();

  const servicesMap = {};

  // 1. Seed Services
  console.log('\n📦 [1/6] Mengimpor Layanan Barbershop (services)...');
  const serviceBatch = writeBatch(db);
  for (const srv of database.services) {
    const srvData = {
      name: srv.name,
      description: srv.description,
      price: srv.price,
      durationMinutes: srv.durationMinutes,
      isActive: srv.isActive !== false,
      createdAt: now,
    };
    servicesMap[srv.id] = { id: srv.id, ...srvData };
    const docRef = doc(db, 'services', srv.id);
    serviceBatch.set(docRef, srvData);
    console.log(`   ✓ ${srv.name} (Rp ${srv.price.toLocaleString('id-ID')})`);
  }
  await serviceBatch.commit();

  // 2. Seed Barbers
  console.log('\n✂️  [2/6] Mengimpor Data Kapster (barbers)...');
  const barberBatch = writeBatch(db);
  for (const barber of database.barbers) {
    const barberData = {
      name: barber.name,
      specialty: barber.specialty || '',
      photoURL: barber.photoURL || '',
      isActive: barber.isActive !== false,
      createdAt: now,
    };
    const docRef = doc(db, 'barbers', barber.id);
    barberBatch.set(docRef, barberData);
    console.log(`   ✓ ${barber.name} (${barber.specialty})`);
  }
  await barberBatch.commit();

  // 3. Seed Users
  console.log('\n👥 [3/6] Mengimpor Profil Pengguna (users)...');
  const userBatch = writeBatch(db);
  for (const user of database.users) {
    const userData = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'customer',
      photoURL: user.photoURL || '',
      createdAt: now,
    };
    const docRef = doc(db, 'users', user.uid);
    userBatch.set(docRef, userData);
    console.log(`   ✓ [${userData.role.toUpperCase()}] ${user.name} (${user.email})`);
  }
  await userBatch.commit();

  // 4. Seed Bookings
  console.log('\n📅 [4/6] Mengimpor Contoh Antrean Booking (bookings)...');
  const bookingBatch = writeBatch(db);
  for (const booking of database.bookings) {
    const date = getDateString(booking.relativeDays || 0);
    const services = (booking.serviceIds || [])
      .map((id) => servicesMap[id])
      .filter(Boolean);

    const bookingData = {
      customerId: booking.customerId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone || '',
      date,
      timeSlot: booking.timeSlot,
      barberId: booking.barberId,
      barberName: booking.barberName,
      services,
      totalPrice: booking.totalPrice,
      status: booking.status,
      createdAt: now - (booking.relativeDays < 0 ? Math.abs(booking.relativeDays) * 86400000 : 0),
    };
    const docRef = doc(db, 'bookings', booking.id);
    bookingBatch.set(docRef, bookingData);
    console.log(`   ✓ ${date} ${booking.timeSlot} - ${booking.customerName} (${booking.status})`);
  }
  await bookingBatch.commit();

  // 5. Seed Reviews
  console.log('\n⭐ [5/6] Mengimpor Ulasan & Rating (reviews)...');
  const reviewBatch = writeBatch(db);
  for (const rev of database.reviews) {
    const revData = {
      bookingId: rev.bookingId,
      customerId: rev.customerId,
      barberId: rev.barberId,
      rating: rev.rating,
      comment: rev.comment,
      createdAt: now,
    };
    const docRef = doc(db, 'reviews', rev.id);
    reviewBatch.set(docRef, revData);
    console.log(`   ✓ ${rev.rating}★: "${rev.comment.substring(0, 45)}..."`);
  }
  await reviewBatch.commit();

  // 6. Seed Blocked Slots
  console.log('\n🚫 [6/6] Mengimpor Slot Jam Ditutup (blockedSlots)...');
  const blockedBatch = writeBatch(db);
  for (const blk of database.blockedSlots) {
    const date = getDateString(blk.relativeDays || 0);
    const blkData = {
      date,
      timeSlot: blk.timeSlot,
      reason: blk.reason || 'Slot ditutup',
      createdAt: now,
    };
    const docRef = doc(db, 'blockedSlots', blk.id);
    blockedBatch.set(docRef, blkData);
    console.log(`   ✓ ${date} ${blk.timeSlot} - ${blk.reason}`);
  }
  await blockedBatch.commit();

  console.log('\n🎉 ========================================================');
  console.log('✅ SEEDING DATABASE JSON BERHASIL DILAKUKAN!');
  console.log('========================================================');
  console.log('Akun Pengujian Siap Digunakan:');
  console.log('• Customer: pelanggan.demo@antriin.com (UID: demo-customer-01)');
  console.log('• Admin:    admin.demo@antriin.com     (UID: demo-admin-01)');
  console.log('\nSekarang buka aplikasi AntriIn, Anda akan langsung melihat layanan, kapster, dan antrean!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('\n❌ Terjadi kesalahan saat seeding:', err.message);
  process.exit(1);
});
