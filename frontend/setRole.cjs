const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('c:/Style and Beauty2.0/Style-and-Beauty/backend/ms-auth/src/main/resources/firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().setCustomUserClaims('m2jwx7Xz9ZZhr5NXjXdhq3MmPMS2', { rol: 'STAFF' })
  .then(() => {
    console.log('Role STAFF assigned to m2jwx7Xz9ZZhr5NXjXdhq3MmPMS2');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
