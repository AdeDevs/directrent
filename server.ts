import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import cors from "cors";

const getFilename = () => {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    try {
      return fileURLToPath(import.meta.url);
    } catch (e) {
      // Ignore
    }
  }
  return typeof __filename !== "undefined" ? __filename : "";
};

const getDirname = () => {
  const fname = getFilename();
  if (fname) {
    return path.dirname(fname);
  }
  return typeof __dirname !== "undefined" ? __dirname : process.cwd();
};

const _filename = getFilename();
const _dirname = getDirname();

// Environment setup logic merged for reliability
function setupEnvironment() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (firebaseConfig.projectId) {
        process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
        process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
      }
    }
    
    const localKeyPath = path.join(process.cwd(), "service-account-key.json");
    if (fs.existsSync(localKeyPath) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
    }

    // Support for setting the key as a JSON string in environment (useful for Vercel secrets)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const tempPath = path.join("/tmp", "temp-sa-key.json");
      fs.writeFileSync(tempPath, process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;
      console.log("[EnvSetup] Created temporary service account key in /tmp from environment variable");
    }
  } catch (err) {
    console.warn("Env setup handled gracefully:", err);
  }
}

setupEnvironment();

// Safe config loading
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    // Fallback values for basic operation if file is missing on Vercel
    firebaseConfig = {
      projectId: "maindirectrent"
    };
  }
} catch (err) {
  console.error("Warning: Failed to load firebase-applet-config.json:", err);
  // Last resort hardcoded fallbacks
  firebaseConfig = firebaseConfig.projectId ? firebaseConfig : {
    projectId: "maindirectrent"
  };
}

// Lazy init admin
let adminApp: admin.app.App | null = null;
function getAdmin() {
  if (!adminApp) {
    console.log(`Initializing Admin SDK...`);
    
    try {
      // 1. First priority: Check for service-account-key.json on disk
      const localKeyPath = path.join(process.cwd(), "service-account-key.json");
      if (fs.existsSync(localKeyPath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf8"));
          adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: firebaseConfig.projectId || serviceAccount.project_id
          });
          console.log("[FirebaseAdmin] Successfully initialized using service-account-key.json on disk.");
          return adminApp;
        } catch (localErr) {
          console.error("[FirebaseAdmin] Failed to parse local service-account-key.json:", localErr);
        }
      }

      // 2. Second priority: Check for explicit service account JSON in environment
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
          adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: firebaseConfig.projectId || serviceAccount.project_id
          });
          console.log("[FirebaseAdmin] Initialized successfully using FIREBASE_SERVICE_ACCOUNT_JSON");
          return adminApp;
        } catch (parseErr) {
          console.error("[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", parseErr);
        }
      }

      // 3. Fallback to default credentials or project ID
      adminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId
      });
      console.log(`Admin SDK initialized for project: ${firebaseConfig.projectId}`);
    } catch (err: any) {
      if (err.code === 'app/duplicate-app') {
        adminApp = admin.app();
      } else {
        console.error("Initialization failed:", err.message);
        let hint = "Check your Firebase credentials.";
        if (process.env.VERCEL) {
          hint = "Vercel: Set 'FIREBASE_SERVICE_ACCOUNT_JSON' in Environment Variables.";
        } else {
          hint = "Local: Ensure 'service-account-key.json' exists or environment is set up.";
        }
        const enrichedError = new Error(`${err.message}. HINT: ${hint}`);
        (enrichedError as any).code = err.code;
        throw enrichedError;
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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

app.get("/api/health", (req, res) => {
  let adminApp = null;
  let adminError = null;
  try {
    adminApp = getAdmin();
  } catch (err: any) {
    adminError = err.message;
    console.warn("Firebase Admin lazy init deferred in health check:", err.message);
  }

  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    projectId: adminApp ? adminApp.options.projectId : (firebaseConfig.projectId || "unconfigured"),
    env: {
      vercel: !!process.env.VERCEL,
      ais: !!process.env.AIS_APPLET_ID,
      node: process.version
    },
    configLoaded: !!firebaseConfig.projectId,
    dbId: firebaseConfig.firestoreDatabaseId,
    adminInitialized: !!adminApp,
    adminError: adminError
  });
});

app.get("/api/fetch-image", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send("Missing url parameter");
  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(500).send("Failed to fetch image");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.json({ data: buffer.toString('base64') });
  } catch (err: any) {
    res.status(500).send(err.message);
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
      const errString = typeof err === 'object' ? JSON.stringify(err) : String(err);
      const isApiDisabled = errString.includes('identitytoolkit.googleapis.com') ||
                            errString.includes('Identity Toolkit API') ||
                            (err.message && (err.message.includes('identitytoolkit.googleapis.com') || err.message.includes('Identity Toolkit API')));

      if (isApiDisabled) {
        let resolvedProjectId = firebaseConfig.projectId || "321230967880";
        const projectMatch = errString.match(/project[=|\/]([a-zA-Z0-9_\-]+)/);
        if (projectMatch && projectMatch[1]) {
          resolvedProjectId = projectMatch[1];
        }
        const activationUrl = `https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=${resolvedProjectId}`;
        
        console.warn(`[FirebaseAdmin] Identity Toolkit API is disabled in GCP project ${resolvedProjectId}. Code 412 returned to client.`);
        return res.status(412).json({
          error: "IDENTITY_TOOLKIT_API_DISABLED",
          message: "The Identity Toolkit API (Firebase Authentication) is disabled in your Google Cloud Platform project.",
          projectId: resolvedProjectId,
          activationUrl
        });
      }

      console.error(`Error in user deletion flow for ${userId}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/users/exists", async (req, res) => {
    const { nin, phoneNumber, email } = req.query;
    
    try {
      const db = getDb();
      let ninExists = false;
      let phoneNumberExists = false;
      let emailExists = false;
      
      if (nin) {
        try {
          const snapshot = await db.collection("users").where("nin", "==", nin).get();
          if (!snapshot.empty) ninExists = true;
        } catch (e: any) {
          // If collection doesn't exist (5 NOT_FOUND), it just means no users exist yet
          if (e.code !== 5) {
            console.warn("NIN check warning:", e.message);
          }
        }
      }
      
      if (phoneNumber) {
        try {
          const rawPhone = String(phoneNumber);
          const digits = rawPhone.replace(/\D/g, '');
          
          let standardDigits = digits;
          if (digits.startsWith('234') && digits.length > 10) {
            standardDigits = digits.slice(3);
          } else if (digits.startsWith('0')) {
            standardDigits = digits.slice(1);
          }
          
          const formatsToCheck = [
            rawPhone,
            `+234${standardDigits}`,
            `+234 ${standardDigits}`
          ];

          if (standardDigits.length >= 10) {
            formatsToCheck.push(`+234 ${standardDigits.slice(0, 3)} ${standardDigits.slice(3, 6)} ${standardDigits.slice(6)}`);
          }
          
          const uniqueFormats = Array.from(new Set(formatsToCheck.filter(Boolean)));
          
          const snapshot = await db.collection("users").where("phoneNumber", "in", uniqueFormats).get();
          if (!snapshot.empty) phoneNumberExists = true;
        } catch (e: any) {
          if (e.code !== 5) {
             console.warn("Phone check warning:", e.message);
          }
        }
      }

      if (email) {
        try {
          const snapshot = await db.collection("users").where("email", "==", email).get();
          if (!snapshot.empty) emailExists = true;
        } catch (e: any) {
          if (e.code !== 5) {
            console.warn("Email check warning:", e.message);
          }
        }
      }
      
      const exists = ninExists || phoneNumberExists || emailExists;
      res.json({ 
        exists,
        reasons: {
          nin: ninExists,
          phoneNumber: phoneNumberExists,
          email: emailExists
        }
      });
    } catch (err: any) {
      console.error("Error checking user existence:", err);
      res.status(500).json({ error: "Failed to check user existence" });
    }
  });

// Global error handler for JSON responses
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[GlobalError]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    code: err.code || "unknown",
    path: req.path
  });
});

app.post("/api/gemini", async (req, res) => {
  const { prompt, images } = req.body;
  const key = process.env.OPENROUTER_API_KEY;
  console.log("[OpenRouter API] Received request, key exists:", !!key);

  if (!key) {
    console.error("[OpenRouter API] Error: Missing API Key.");
    return res.status(500).json({ error: "Server Configuration Error: Missing API Key." });
  }

  try {
    console.log("[OpenRouter API] Importing openai");
    const { OpenAI } = await import("openai");
    
    const client = new OpenAI({
      apiKey: key,
      baseURL: "https://openrouter.ai/api/v1"
    });

    // Format images for OpenRouter (compatible with OpenAI vision)
    const content = [];
    if (images && Array.isArray(images)) {
        for (const img of images) {
            if (img.inlineData) {
              content.push({
                type: "image_url",
                image_url: {
                  url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`
                }
              });
            }
        }
    }
    content.push({ type: "text", text: prompt });

    console.log("[OpenRouter API] Generating content...");
    const result = await client.chat.completions.create({
      model: "qwen/qwen-2.5-vl-72b-instruct",
      messages: [{ role: "user", content: content as any }]
    });
    
    console.log("[OpenRouter API] Content generated");
    let text = result.choices[0].message.content;
    
    // Sanitize output to extract the first JSON object found
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        text = match[0];
      }
    }
    
    res.json({ text });
  } catch (err: any) {
    console.error("OpenRouter API Error:", JSON.stringify(err, null, 2));
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// Vite/Static middleware setup
async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
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
  }).catch(err => {
    console.error("Failed to start server:", err);
  });
} else {
  // On Vercel, we still need to initialize the app (but without Vite)
  configureApp().catch(err => console.error("Vercel config error:", err));
}

export default app;
