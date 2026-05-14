import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Lazy init admin
let adminApp: admin.app.App | null = null;
function getAdmin() {
  if (!adminApp) {
    const projectId = firebaseConfig.projectId;
    console.log(`Initializing Admin SDK for project: ${projectId}`);
    
    try {
      // Use default environment credentials. 
      // In local dev, you'd use GOOGLE_APPLICATION_CREDENTIALS env var.
      // In Cloud Run, it's automatic.
      adminApp = admin.initializeApp({
        projectId: projectId,
      });
      console.log(`Admin SDK initialized for project: ${projectId}`);
    } catch (err: any) {
      if (err.code === 'app/duplicate-app') {
        adminApp = admin.app();
      } else {
        console.error("Initialization failed:", err.message);
        throw err;
      }
    }
  }
  return adminApp;
}

// Helper to get Firestore instance with the correct database
function getDb() {
  const currentAdmin = getAdmin();
  return firebaseConfig.firestoreDatabaseId 
    ? getFirestore(currentAdmin, firebaseConfig.firestoreDatabaseId)
    : getFirestore(currentAdmin);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.get("/api/health", (req, res) => {
    try {
      const adminApp = getAdmin();
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        projectId: adminApp.options.projectId
      });
    } catch (err: any) {
      res.status(500).json({ status: "unhealthy", error: err.message });
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
