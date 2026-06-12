const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

async function main() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  const localKeyPath = path.join(process.cwd(), "service-account-key.json");
  if (fs.existsSync(localKeyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.projectId
    });
  } else {
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  }

  const db = firebaseConfig.firestoreDatabaseId 
    ? admin.firestore().firestore.database(firebaseConfig.firestoreDatabaseId)
    : admin.firestore();

  const docId = "4SZTN3hjEIdoPgMqdaPK1Tnq42q1_15LMur4tzbZGme98RGiYtwRdEci2_listing_1780921411900";
  console.log("Fetching doc:", docId);
  try {
    const snapshot = await db.collection("conversations").doc(docId).get();
    if (!snapshot.exists) {
      console.log("Document does not exist");
      return;
    }
    const data = snapshot.data();
    console.log("Document Data:", JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error("Error fetching doc:", err);
  }
}

main();
