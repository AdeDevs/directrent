import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test Connection
async function testConnection() {
  try {
    // Attempting to read a dummy doc to verify connection
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase initialized and connected successfully.");
  } catch (error: any) {
    if (error.message?.includes('offline')) {
      console.error("Firebase connection failed: Client appears to be offline.");
    } else if (error.code === 'permission-denied') {
      // This is actually a good sign - it means we reached the server and rules blocked us
      console.log("Firebase connection verified (Permission Denied).");
    } else {
      console.warn("Firebase initialization notice:", error.message);
    }
  }
}

testConnection();
