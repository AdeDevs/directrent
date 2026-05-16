import "./env-setup.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe config loading
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    // Fallback values for basic operation if file is missing on Vercel
    firebaseConfig = {
      projectId: "gen-lang-client-0583982573",
      firestoreDatabaseId: "ai-studio-ffc8f15f-494e-4acb-9dab-489a4a819320"
    };
  }
} catch (err) {
  console.error("Warning: Failed to load firebase-applet-config.json:", err);
  // Last resort hardcoded fallbacks
  firebaseConfig = firebaseConfig.projectId ? firebaseConfig : {
    projectId: "gen-lang-client-0583982573",
    firestoreDatabaseId: "ai-studio-ffc8f15f-494e-4acb-9dab-489a4a819320"
  };
}

// Lazy init admin
let adminApp: admin.app.App | null = null;
function getAdmin() {
  if (!adminApp) {
    console.log(`Initializing Admin SDK...`);
    
    try {
      // Initialize with correct project ID
      adminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId
      });
      console.log(`Admin SDK initialized for project: ${firebaseConfig.projectId}`);
    } catch (err: any) {
      if (err.code === 'app/duplicate-app') {
        adminApp = admin.app();
      } else {
        console.error("Initialization failed:", err.message);
        if (err.message.includes("default credentials")) {
          console.error("HINT: You are running locally. See instructions to create 'service-account-key.json'.");
        }
        throw err;
      }
    }
  }
  return adminApp;
}

// Helper to get Firestore instance with the correct database
function getDb() {
  const currentAdmin = getAdmin();
  // Using getFirestore(app, databaseId) from firebase-admin/firestore
  return firebaseConfig.firestoreDatabaseId 
    ? getFirestore(currentAdmin, firebaseConfig.firestoreDatabaseId)
    : getFirestore(currentAdmin);
}

export const app = express();

const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

app.get("/api/health", (req, res) => {
  try {
    const adminApp = getAdmin();
    const files = fs.readdirSync(process.cwd());
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      projectId: adminApp.options.projectId,
      env: {
        vercel: !!process.env.VERCEL,
        node: process.version,
        cwd: process.cwd(),
        files: files.slice(0, 10) // Only first 10 for brevity
      },
      configLoaded: !!firebaseConfig.projectId,
      dbId: firebaseConfig.firestoreDatabaseId
    });
  } catch (err: any) {
    console.error("Health check failed:", err.message);
    res.status(500).json({ 
      status: "unhealthy", 
      error: err.message,
      env: process.env.VERCEL ? 'vercel' : 'ais',
      stack: err.stack ? err.stack.split('\n')[0] : null
    });
  }
});

  app.get("/api/admin/debug-user/:userId", async (req, res) => {
    try {
      const db = getDb();
      const doc = await db.collection("users").doc(req.params.userId).get();
      res.json({ exists: doc.exists, data: doc.data() });
    } catch (err: any) {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  app.delete("/api/admin/users/:userId", async (req, res) => {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Missing or invalid authorization" });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const adminApp = getAdmin();
      const decodedToken = await adminApp.auth().verifyIdToken(idToken);
      
      // Determine if the user is an admin
      const db = getDb();
      
      const primaryOwnerEmail = 'adeyemiakinyemi01@gmail.com';
      const isPrimaryOwner = decodedToken.email?.toLowerCase() === primaryOwnerEmail;
      
      let isAdminUser = isPrimaryOwner;
      
      if (!isAdminUser) {
        const adminDoc = await db.collection("users").doc(decodedToken.uid).get();
        const userRole = adminDoc.data()?.role;
        isAdminUser = adminDoc.exists && ['admin', 'god', 'admin_staff', 'moderator'].includes(userRole);
      }

      if (!isAdminUser) {
         console.warn(`Unauthorized deletion attempt by user ${decodedToken.uid} (${decodedToken.email})`);
         return res.status(403).json({ error: "Forbidden: Only admins can delete users" });
      }

      await adminApp.auth().deleteUser(userId);
      res.json({ success: true, message: `User ${userId} deleted from Auth` });
    } catch (err: any) {
      console.error(`Error in user deletion flow for ${userId}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/users/exists", async (req, res) => {
    const { nin, phoneNumber, email } = req.query;
    
    try {
      const db = getDb();
      let exists = false;
      
      if (nin) {
        try {
          const snapshot = await db.collection("users").where("nin", "==", nin).get();
          if (!snapshot.empty) exists = true;
        } catch (e: any) {
          // If collection doesn't exist (5 NOT_FOUND), it just means no users exist yet
          if (e.code !== 5) {
            console.warn("NIN check warning:", e.message);
          }
        }
      }
      
      if (!exists && phoneNumber) {
        try {
          const snapshot = await db.collection("users").where("phoneNumber", "==", phoneNumber).get();
          if (!snapshot.empty) exists = true;
        } catch (e: any) {
          if (e.code !== 5) {
             console.warn("Phone check warning:", e.message);
          }
        }
      }

      if (!exists && email) {
        try {
          const snapshot = await db.collection("users").where("email", "==", email).get();
          if (!snapshot.empty) exists = true;
        } catch (e: any) {
          if (e.code !== 5) {
            console.warn("Email check warning:", e.message);
          }
        }
      }
      
      // If all checks failed due to errors (e.g. 5 NOT_FOUND), just return exists: false
      // to avoid breaking the UI for the user.
      res.json({ exists });
    } catch (err: any) {
      console.error("Error checking user existence:", err);
      res.status(500).json({ error: "Failed to check user existence" });
    }
  });

// Vite/Static middleware setup
async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Frontend build not found");
        }
      });
    }
  }
}

// Start if run directly or in AIS
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  configureApp().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
