import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

let serviceAccount;
if (fs.existsSync('./service-account-key.json')) {
  serviceAccount = JSON.parse(fs.readFileSync('./service-account-key.json', 'utf8'));
} else {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function check() {
  const users = await db.collection('users').get();
  users.forEach(doc => {
    const data = doc.data();
    if (data.fcmTokens && data.fcmTokens.length > 0) {
      console.log(`User ${doc.id} (${data.email}) has ${data.fcmTokens.length} tokens. Tokens: ${data.fcmTokens}`);
    }
  });
}
check().catch(console.error);
