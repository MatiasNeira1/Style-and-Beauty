const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('c:/Style and Beauty2.0/Style-and-Beauty/backend/ms-auth/src/main/resources/firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().updateUser('Qo8Kt0NOv1a4irWj7wjKG113cLt1', {
  password: 'Password123!'
})
  .then(() => {
    console.log('Password for mati.neiras@duocuc.cl successfully set to Password123!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error updating password:', error);
    process.exit(1);
  });
