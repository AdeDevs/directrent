import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';

let configPath = 'firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    await setDoc(doc(db, 'listings', 'test1234'), { hello: 'world' });
    console.log("Write success!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
test();
