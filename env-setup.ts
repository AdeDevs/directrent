import fs from "fs";
import path from "path";

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const localKeyPath = path.join(process.cwd(), "service-account-key.json");

  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (firebaseConfig.projectId) {
      process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
      process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
      console.log(`[EnvSetup] Forced project ID to: ${firebaseConfig.projectId}`);
    }
  }

  if (fs.existsSync(localKeyPath) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
    console.log(`[EnvSetup] Found local service account key: ${localKeyPath}`);
  }
} catch (err) {
  console.error("[EnvSetup] Error setting up environment:", err);
}
