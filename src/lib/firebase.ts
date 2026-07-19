import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // If user is logged out, permission errors are expected during cleanup.
  if (!auth.currentUser && (error instanceof Error && error.message.includes('permission'))) {
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyErrorMessage(error: any, defaultMsg: string = "An unexpected error occurred. Please try again."): string {
  if (!error) return defaultMsg;
  
  let msg = error.message || String(error);
  let isFirestoreError = false;
  let opType = "";
  let path = "";
  
  // Try to parse if it's the JSON from handleFirestoreError
  if (typeof msg === 'string' && msg.trim().startsWith('{') && msg.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        msg = parsed.error;
        isFirestoreError = true;
        opType = parsed.operationType || "";
        path = parsed.path || "";
      }
    } catch (e) {
      // Not a valid JSON, keep msg as is
    }
  }

  const lowercaseMsg = msg.toLowerCase();

  // Network connection failures
  if (lowercaseMsg.includes('network') || lowercaseMsg.includes('failed to fetch') || lowercaseMsg.includes('offline') || lowercaseMsg.includes('internet')) {
    return "Connection error. Please check your internet connection and try again.";
  }

  // Permission denied / Rules
  if (lowercaseMsg.includes('permission') || lowercaseMsg.includes('denied') || lowercaseMsg.includes('unauthorized')) {
    return "You don't have permission to perform this action. Please make sure you are signed in correctly.";
  }

  // Timeout / Cancelled
  if (lowercaseMsg.includes('timeout') || lowercaseMsg.includes('deadline-exceeded') || lowercaseMsg.includes('exceeded')) {
    return "The request took too long to respond. Please try again in a moment.";
  }

  // Document not found
  if (lowercaseMsg.includes('not-found') || lowercaseMsg.includes('no-document') || lowercaseMsg.includes('does not exist')) {
    return "The requested information could not be found.";
  }

  // Resource exhausted / Rate limit
  if (lowercaseMsg.includes('resource-exhausted') || lowercaseMsg.includes('too-many-requests') || lowercaseMsg.includes('rate limit')) {
    return "We are experiencing high traffic. Please wait a moment and try again.";
  }

  // Already exists
  if (lowercaseMsg.includes('already-exists') || lowercaseMsg.includes('already registered')) {
    return "This record already exists in our system.";
  }

  // If there's a clean, non-technical message and it's not a giant JSON, return it
  if (msg && !isFirestoreError && !msg.includes('Firebase') && !msg.includes('Error:') && msg.length < 80) {
    return msg;
  }

  // Otherwise return the helpful default message
  return defaultMsg;
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ...(typeof window !== 'undefined' ? {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  } : {})
}, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);
export const messaging = async () => (await isSupported()) ? getMessaging(app) : null;

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
      // This is a sign that the server is reachable and security rules are active
      console.log("Firebase server reachability verified.");
    } else {
      console.warn("Firebase initialization notice:", error.message);
    }
  }
}

testConnection();
