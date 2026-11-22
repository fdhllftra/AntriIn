/**
 * Script Seeder Database AntriIn dari File JSON (test-database.json)
 *
 * Mengimpor seluruh data testing (Layanan, Kapster, Akun Pengguna, Antrean Booking,
 * Review, & Blocked Slots) langsung ke Firebase Firestore.
 *
 * Memakai Firebase Admin SDK agar penulisan tidak diblokir oleh firestore.rules
 * yang ketat (klien tidak boleh menulis role admin / booking arbitrary).
 *
 * Cara menjalankan:
 *   set FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\service-account.json
 *   npm run seed:json
 * atau:
 *   node scripts/seed-from-json.js
 */

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error(
    'ERROR: Set FIREBASE_SERVICE_ACCOUNT_PATH dulu, contoh:\n' +
      '  set FIREBASE_SERVICE_ACCOUNT_PATH=C:\\path\\to\\service-account.json\n' +
      '  npm run seed:json'
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

const dataPath = path.resolve(__dirname, '../data/test-database.json');
const database = require(dataPath);

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

  const now = Date.now();
  const servicesMap = {};

  // 1. Seed Services
  console.log('\n📦 [1/6] Mengimpor Layanan Barbershop (services)...');
  let batch = db.batch();
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
    batch.set(db.collection('services').doc(srv.id), srvData);
    console.log(`   ✓ ${srv.name} (Rp ${srv.price.toLocaleString('id-ID')})`);
  }
  await batch.commit();

  // 2. Seed Barbers
  console.log('\n✂️  [2/6] Mengimpor Data Kapster (barbers)...');
  batch = db.batch();
  for (const barber of database.barbers) {
    const barberData = {
      name: barber.name,
      specialty: barber.specialty || '',
      photoURL: barber.photoURL || '',
      isActive: barber.isActive !== false,
      createdAt: now,
    };
    batch.set(db.collection('barbers').doc(barber.id), barberData);
    console.log(`   ✓ ${barber.name} (${barber.specialty})`);
  }
  await batch.commit();

  // 3. Seed Users (dari Admin SDK, melewati aturan klien)
  console.log('\n👥 [3/6] Mengimpor Profil Pengguna (users)...');
  batch = db.batch();
  for (const user of database.users) {
    const userData = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'customer',
      photoURL: user.photoURL || '',
      createdAt: now,
    };
    batch.set(db.collection('users').doc(user.uid), userData);
    console.log(`   ✓ [${userData.role.toUpperCase()}] ${user.name} (${user.email})`);
  }
  await batch.commit();

  // 4. Seed Bookings
  console.log('\n📅 [4/6] Mengimpor Contoh Antrean Booking (bookings)...');
  batch = db.batch();
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
    batch.set(db.collection('bookings').doc(booking.id), bookingData);
    console.log(`   ✓ ${date} ${booking.timeSlot} - ${booking.customerName} (${booking.status})`);
  }
  await batch.commit();

  // 5. Seed Reviews
  console.log('\n⭐ [5/6] Mengimpor Ulasan & Rating (reviews)...');
  batch = db.batch();
  for (const rev of database.reviews) {
    const revData = {
      bookingId: rev.bookingId,
      customerId: rev.customerId,
      barberId: rev.barberId,
      rating: rev.rating,
      comment: rev.comment,
      createdAt: now,
    };
    batch.set(db.collection('reviews').doc(rev.id), revData);
    console.log(`   ✓ ${rev.rating}★: "${rev.comment.substring(0, 45)}..."`);
  }
  await batch.commit();

  // 6. Seed Blocked Slots
  console.log('\n🚫 [6/6] Mengimpor Slot Jam Ditutup (blockedSlots)...');
  batch = db.batch();
  for (const blk of database.blockedSlots) {
    const date = getDateString(blk.relativeDays || 0);
    const blkData = {
      date,
      timeSlot: blk.timeSlot,
      reason: blk.reason || 'Slot ditutup',
      createdAt: now,
    };
    batch.set(db.collection('blockedSlots').doc(blk.id), blkData);
    console.log(`   ✓ ${date} ${blk.timeSlot} - ${blk.reason}`);
  }
  await batch.commit();

  console.log('\n🎉 ========================================================');
  console.log('✅ SEEDING DATABASE JSON BERHASIL DILAKUKAN!');
  console.log('========================================================');
  console.log('Data realtime akan langsung tampil di aplikasi setelah listener tersambung.');
  console.log(
    '\nCatatan: akun demo dari data testing bukan jalur login; gunakan Firebase Auth sungguhan.'
  );
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('\n❌ Terjadi kesalahan saat seeding:', err.message);
  process.exit(1);
});
