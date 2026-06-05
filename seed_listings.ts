import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch, serverTimestamp, getDocs, collection } from 'firebase/firestore';
import { FEATURED_LISTINGS } from './src/data';
import * as fs from 'fs';

let configPath = 'firebase-applet-config.json';
if (!fs.existsSync(configPath)) {
  console.log("No firebase-applet-config found");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function seed() {
  try {
    const snap = await getDocs(collection(db, 'listings'));
    console.log("Fetched " + snap.size + " listings.");
    const leonId = 'XwoFr8yV2BNmT0oQYeSBKdLG8SW2';
    const peaceId = 'QIRzhnnqCkeJCKN1VKvTsNL40bl2';

    const batch = writeBatch(db);
    for (const l of FEATURED_LISTINGS) {
      const docRef = doc(db, 'listings', l.id.toString());
      let finalAgentId = l.agent?.id;
      if (finalAgentId === 'agent_leon') finalAgentId = leonId;
      if (finalAgentId === 'agent_peace') finalAgentId = peaceId;

      batch.set(docRef, {
        ...l,
        agent: {
          ...l.agent,
          id: finalAgentId
        },
        status: 'ACTIVE',
        isApproved: true,
        createdAt: serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
    console.log("Seeded " + FEATURED_LISTINGS.length + " listings.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
seed();
