/* ============================================================
   SUPER ADMIN SEED SCRIPT
   Bootstraps the very first Super Admin account with role custom claims.
   Usage:
     node seedSuperAdmin.js <email> <password> [displayName]
   Example:
     node seedSuperAdmin.js superadmin@ourengine.com Admin123! "Super Admin"
   ============================================================ */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Look for service account key if provided, otherwise default application credentials
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  console.log(`Using service account key: ${serviceAccountPath}`);
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
  });
} else if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('Using local Firebase emulator.');
  initializeApp({ projectId: 'demo-saas' });
} else {
  console.error('\n⚠️  MISSING SERVICE ACCOUNT KEY');
  console.error('To run this admin script against your Firebase project from your computer:');
  console.error('1. Go to Firebase Console > Project Settings > Service accounts tab');
  console.error('2. Click "Generate new private key"');
  console.error(`3. Save the downloaded JSON file as:\n   ${path.resolve(__dirname, '../serviceAccountKey.json')}\n`);
  process.exit(1);
}

const auth = getAuth();
const db = getFirestore();

async function seedSuperAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.SUPER_ADMIN_EMAIL || 'admin@ourengine.com';
  const password = args[1] || process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
  const displayName = args[2] || 'Platform Super Admin';

  console.log('----------------------------------------------------');
  console.log('🌟 Bootstrapping Super Admin Account');
  console.log(`   Email: ${email}`);
  console.log(`   Name:  ${displayName}`);
  console.log('----------------------------------------------------');

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`User already exists in Firebase Auth (UID: ${userRecord.uid}).`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log('Creating new Firebase Auth user...');
        userRecord = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        });
        console.log(`Created user with UID: ${userRecord.uid}`);
      } else {
        throw err;
      }
    }

    // Assign custom claims
    console.log('Assigning SUPER_ADMIN custom claims...');
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'SUPER_ADMIN',
      tenantId: null,
    });

    // Write to Firestore /users/{uid}
    console.log('Writing Firestore user document...');
    await db.collection('users').doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email,
        displayName,
        role: 'SUPER_ADMIN',
        tenantId: null,
        status: 'ACTIVE',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Initialize platform config if not existing
    console.log('Initializing platform configuration...');
    const configRef = db.collection('platformConfig').doc('main');
    await configRef.set(
      {
        platformName: 'OurEngine Multi-Tenant SaaS',
        version: '1.0.0',
        supportedCurrencies: ['INR', 'USD'],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log('----------------------------------------------------');
    console.log('✅ Super Admin bootstrapped successfully!');
    console.log(`   Login Email:    ${email}`);
    console.log(`   Role:           SUPER_ADMIN`);
    console.log(`   UID:            ${userRecord.uid}`);
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed Super Admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
