import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type NotificationType = "message" | "verification" | "listing" | "system";

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  link?: string,
  relatedId?: string
) => {
  if (!userId || userId === "unknown") return;

  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
      link: link || null,
      relatedId: relatedId || null,
    });
    
    // Trigger push notification via backend
    fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        body: message,
        link,
        relatedId
      })
    }).catch(e => console.warn("Push trigger failed:", e));

  } catch (err) {
    console.error("Error creating notification:", err);
  }
};
