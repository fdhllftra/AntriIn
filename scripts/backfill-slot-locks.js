/**
 * Backfill slotLocks dari booking yang sudah ada di Firestore.
 *
 * Bookings lama dibuat sebelum koleksi slotLocks ada, sehingga ketersediaan
 * tidak akan terlihat oleh pelanggan sampai kunci slotnya dibuat. Script ini
 * aman dijalankan berulang: kunci yang sudah ada tidak akan ditimpa.
 *
 * Cara menjalankan:
 *   $env:FIREBASE_SERVICE_ACCOUNT_PATH = "C:\path\service-account.json"
 *   npm run backfill:slot-locks
 */

const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error(
    'ERROR: Set FIREBASE_SERVICE_ACCOUNT_PATH dulu, contoh:\n' +
      '  $env:FIREBASE_SERVICE_ACCOUNT_PATH = "C:\\path\\service-account.json"\n' +
      '  npm run backfill:slot-locks'
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

function buildSlotLockId(date, barberId, timeSlot) {
  return `${date}_${barberId}_${String(timeSlot).replace(/:/g, '-')}`;
}

async function run() {
  console.log('Membaca booking aktif dari Firestore...');
  const snapshot = await db
    .collection('bookings')
    .where('status', 'in', ['Menunggu', 'Selesai'])
    .get();

  const refs = [];
  const locks = [];
  for (const bookingDoc of snapshot.docs) {
    const booking = bookingDoc.data();
    if (!booking.date || !booking.barberId || !booking.timeSlot || !booking.customerId) {
      continue;
    }
    const id = buildSlotLockId(booking.date, booking.barberId, booking.timeSlot);
    refs.push(db.collection('slotLocks').doc(id));
    locks.push({
      id,
      date: booking.date,
      timeSlot: booking.timeSlot,
      barberId: booking.barberId,
      customerId: booking.customerId,
      createdAt: booking.createdAt || Date.now(),
    });
  }

  if (refs.length === 0) {
    console.log('Tidak ada booking aktif yang perlu di-backfill.');
    return;
  }

  const existing = await db.getAll(...refs);
  let batch = db.batch();
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < refs.length; i += 1) {
    if (existing[i].exists) {
      skipped += 1;
      continue;
    }
    batch.set(refs[i], locks[i]);
    written += 1;
    if (written % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  await batch.commit();
  console.log(
    `Selesai. ${written} kunci slot dibuat, ${skipped} kunci sudah ada dan dilewati.`
  );
}

run().catch((err) => {
  console.error('Backfill gagal:', err);
  process.exitCode = 1;
});
