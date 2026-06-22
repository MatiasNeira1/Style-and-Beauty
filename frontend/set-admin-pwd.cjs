const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const targetUid = process.env.FIREBASE_ADMIN_UID;
const newPassword = process.env.FIREBASE_ADMIN_PASSWORD;

if (!serviceAccountPath || !targetUid || !newPassword) {
  console.error('Define FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_ADMIN_UID y FIREBASE_ADMIN_PASSWORD antes de ejecutar este script.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().updateUser(targetUid, {
  password: newPassword
})
  .then(() => {
    console.log(`Password updated for Firebase user ${targetUid}.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating password:', error);
    process.exit(1);
  });
