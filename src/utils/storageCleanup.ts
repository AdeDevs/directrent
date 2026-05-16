import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Safely deletes a file from Firebase Storage.
 * Handles the 'storage/object-not-found' error gracefully.
 */
export const safeDeleteStorageFile = async (url: string | null | undefined) => {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return;
  }

  try {
    // In Modular SDK, ref(storage, url) handles paths, gs://, and https:// download URLs
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (e: any) {
    if (e.code !== 'storage/object-not-found') {
      console.warn(`Could not delete storage object: ${url}`, e.message);
    }
  }
};
