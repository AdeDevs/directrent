const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const pushEndpoint = `
app.post("/api/notifications/push", async (req, res) => {
  try {
    const { userId, title, body, link, relatedId } = req.body;
    if (!userId || !title) return res.status(400).json({ error: "Missing required fields" });

    const db = getDb();
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    
    const fcmTokens = userDoc.data()?.fcmTokens || [];
    
    if (fcmTokens.length > 0) {
      const adminSDK = getAdmin();
      const message = {
        notification: { title, body },
        data: { link: link || '', relatedId: relatedId || '' },
        tokens: fcmTokens
      };
      
      const response = await adminSDK.messaging().sendEachForMulticast(message);
      
      // Clean up invalid tokens
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
            failedTokens.push(fcmTokens[idx]);
          }
        }
      });
      
      if (failedTokens.length > 0) {
        await userDoc.ref.update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
        });
      }
      
      return res.json({ success: true, responses: response });
    }
    
    res.json({ success: true, message: "No tokens found for user" });
  } catch (error) {
    console.error("Push notification error:", error);
    res.status(500).json({ error: error.message });
  }
});
`;

let newContent = content.replace(
  'export const app = express();',
  'export const app = express();\n' + pushEndpoint
);

fs.writeFileSync('server.ts', newContent);
