import { collection, getDocs, deleteDoc, doc, writeBatch, query, limit, updateDoc, where, getDoc } from 'firebase/firestore';
import { getIdToken } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { logModeratorAction } from '../lib/auditLogger';
import { safeDeleteStorageFile } from './storageCleanup';

export const purgeAllChats = async () => {
  try {
    const convQuery = await getDocs(collection(db, 'conversations'));
    for (const conv of convQuery.docs) {
      const messagesQuery = await getDocs(collection(db, 'conversations', conv.id, 'messages'));
      const batch = writeBatch(db);
      messagesQuery.forEach(msg => {
        batch.delete(doc(db, 'conversations', conv.id, 'messages', msg.id));
      });
      batch.delete(doc(db, 'conversations', conv.id));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'conversations');
  }
};

export const purgeAllFavorites = async () => {
  try {
    const usersQuery = await getDocs(collection(db, 'users'));
    for (const user of usersQuery.docs) {
      if (user.data().role === 'tenant') {
        const favsQuery = await getDocs(collection(db, 'users', user.id, 'favorites'));
        if (favsQuery.docs.length > 0) {
          const batch = writeBatch(db);
          favsQuery.forEach(fav => {
            batch.delete(doc(db, 'users', user.id, 'favorites', fav.id));
          });
          await batch.commit();
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users/favorites');
  }
};

export const purgeAllNotifications = async () => {
  try {
    const notifQuery = await getDocs(collection(db, 'notifications'));
    if (notifQuery.docs.length > 0) {
      let count = 0;
      let batch = writeBatch(db);
      for (const nDoc of notifQuery.docs) {
        batch.delete(doc(db, 'notifications', nDoc.id));
        count++;
        if (count === 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'notifications');
  }
};

export const purgeAllReports = async () => {
  try {
    const reportsQuery = await getDocs(collection(db, 'reports'));
    if (reportsQuery.docs.length > 0) {
      let count = 0;
      let batch = writeBatch(db);
      for (const rDoc of reportsQuery.docs) {
        batch.delete(doc(db, 'reports', rDoc.id));
        count++;
        if (count === 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reports');
  }
};

export const purgeAllReviews = async () => {
  try {
    const reviewsQuery = await getDocs(collection(db, 'reviews'));
    if (reviewsQuery.docs.length > 0) {
      let count = 0;
      let batch = writeBatch(db);
      for (const rDoc of reviewsQuery.docs) {
        batch.delete(doc(db, 'reviews', rDoc.id));
        count++;
        if (count === 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    }
    
    // Also reset avgRating and reviewsCount on users if applicable
    const usersQuery = await getDocs(collection(db, 'users'));
    if (usersQuery.docs.length > 0) {
      let count = 0;
      let uBatch = writeBatch(db);
      for (const user of usersQuery.docs) {
        uBatch.update(doc(db, 'users', user.id), {
          avgRating: 0,
          completedTxns: 0
        });
        count++;
        if (count === 450) {
          await uBatch.commit();
          uBatch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await uBatch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reviews');
  }
};

export const purgeAllTours = async () => {
  try {
    const toursQuery = await getDocs(collection(db, 'tours'));
    if (toursQuery.docs.length > 0) {
      let count = 0;
      let batch = writeBatch(db);
      for (const tDoc of toursQuery.docs) {
        batch.delete(doc(db, 'tours', tDoc.id));
        count++;
        if (count === 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tours');
  }
};

export const resetAllAnalytics = async () => {
  try {
    const analyticsQuery = await getDocs(collection(db, 'analytics'));
    if (analyticsQuery.docs.length > 0) {
      let count = 0;
      let batch = writeBatch(db);
      for (const aDoc of analyticsQuery.docs) {
        batch.delete(doc(db, 'analytics', aDoc.id));
        count++;
        if (count === 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    }

    // Also zero out counts on listings
    const listingsQuery = await getDocs(collection(db, 'listings'));
    if (listingsQuery.docs.length > 0) {
      let count = 0;
      let tBatch = writeBatch(db);
      for (const listing of listingsQuery.docs) {
        tBatch.update(doc(db, 'listings', listing.id), {
          viewCount: 0,
          favoritesCount: 0,
          inquiryCount: 0
        });
        count++;
        if (count === 450) {
          await tBatch.commit();
          tBatch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await tBatch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'analytics/listings');
  }
};

export const purgeListingData = async (listingId: string) => {
  if (!listingId) return;

  try {
    const listingRef = doc(db, 'listings', listingId);
    const listingSnap = await getDoc(listingRef);
    
    if (listingSnap.exists()) {
      const listing = listingSnap.data();
      
      // Purge listing images from storage
      const imagesToDelete = [];
      if (listing.image) imagesToDelete.push(listing.image);
      if (listing.images && Array.isArray(listing.images)) {
        imagesToDelete.push(...listing.images);
      }

      for (const imgUrl of imagesToDelete) {
        await safeDeleteStorageFile(imgUrl);
      }
      
      // Purge listing video from storage
      if (listing.video) {
        await safeDeleteStorageFile(listing.video);
      }
      if (listing.videoUrl) {
        await safeDeleteStorageFile(listing.videoUrl);
      }
    }
    
    // Finally delete the document
    const { writeBatch, increment } = await import('firebase/firestore');
    await logModeratorAction('delete', 'listing', listingId);
    const batch = writeBatch(db);
    batch.delete(listingRef);
    
    // Decrement the agent's listing count if we have the agent ID
    if (listingSnap.exists() && listingSnap.data().agent?.id) {
       const userRef = doc(db, 'users', listingSnap.data().agent.id);
       batch.update(userRef, {
         listingsCount: increment(-1)
       });
    }
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`Error purging listing ${listingId}:`, error);
    throw error;
  }
};

export const purgeUserData = async (userId: string) => {
  if (!userId) return;

  try {
    // 0. Get user record first for storage cleanup metadata
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userData = userSnap.exists() ? userSnap.data() : null;

    // 1. Listings (if agent) - Purge documents AND storage assets
    const listingsQuery = await getDocs(query(collection(db, 'listings'), where('agent.id', '==', userId)));
    if (!listingsQuery.empty) {
      for (const listingDoc of listingsQuery.docs) {
        await purgeListingData(listingDoc.id);
      }
    }

    // 2. Notifications
    const notificationsQuery = await getDocs(query(collection(db, 'notifications'), where('userId', '==', userId)));
    if (!notificationsQuery.empty) {
      const notificationsBatch = writeBatch(db);
      notificationsQuery.forEach(doc => notificationsBatch.delete(doc.ref));
      await notificationsBatch.commit();
    }

    // 3. Verifications - Purge documents AND storage assets
    const verificationsQuery = await getDocs(query(collection(db, 'verifications'), where('userId', '==', userId)));
    if (!verificationsQuery.empty) {
      const verificationsBatch = writeBatch(db);
      for (const vDoc of verificationsQuery.docs) {
        const vData = vDoc.data();
        
        // Purge ID images
        const filesToClean = [
          vData.govtIdUrl,
          vData.selfieUrl,
          vData.idCardUrl,
          vData.passportUrl
        ];

        for (const fileUrl of filesToClean) {
          await safeDeleteStorageFile(fileUrl);
        }
        verificationsBatch.delete(vDoc.ref);
      }
      await verificationsBatch.commit();
    }

    // 4. Also check user profile for verification URLs that might not be in a separate document
    const userFilesToClean = [
      userData?.govtIdUrl,
      userData?.selfieUrl
    ];
    for (const fileUrl of userFilesToClean) {
      await safeDeleteStorageFile(fileUrl);
    }

    // 4. Reviews (Tenant or Agent)
    const tenantReviewsQuery = await getDocs(query(collection(db, 'reviews'), where('tenantId', '==', userId)));
    if (!tenantReviewsQuery.empty) {
      const tenantReviewsBatch = writeBatch(db);
      tenantReviewsQuery.forEach(doc => tenantReviewsBatch.delete(doc.ref));
      await tenantReviewsBatch.commit();
    }

    const agentReviewsQuery = await getDocs(query(collection(db, 'reviews'), where('agentId', '==', userId)));
    if (!agentReviewsQuery.empty) {
      const agentReviewsBatch = writeBatch(db);
      agentReviewsQuery.forEach(doc => agentReviewsBatch.delete(doc.ref));
      await agentReviewsBatch.commit();
    }

    // 5. Conversations (Participants)
    const conversationsQuery = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', userId)));
    for (const conv of conversationsQuery.docs) {
      const messagesQuery = await getDocs(collection(db, 'conversations', conv.id, 'messages'));
      if (!messagesQuery.empty) {
        const messagesBatch = writeBatch(db);
        messagesQuery.forEach(msg => messagesBatch.delete(msg.ref));
        await messagesBatch.commit();
      }
      await deleteDoc(conv.ref);
    }

    // 6. User subcollections (Favorites)
    const favoritesQuery = await getDocs(collection(db, 'users', userId, 'favorites'));
    if (!favoritesQuery.empty) {
      const favoritesBatch = writeBatch(db);
      favoritesQuery.forEach(fav => favoritesBatch.delete(fav.ref));
      await favoritesBatch.commit();
    }

    // 7. Cleanup User Avatar from Storage
    await safeDeleteStorageFile(userData?.avatarUrl);

    // 8. Delete the user from Auth via backend
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await getIdToken(currentUser);
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.warn(`Auth deletion for user ${userId} returned ${response.status}: ${errorData.error}`);
        } else {
          console.log(`Successfully deleted auth record for user ${userId}`);
        }
      }
    } catch (authErr) {
      console.error("Failed to delete user from Auth:", authErr);
      // We continue since we already cleaned up the data
    }

    // 9. Delete the user profile document
    await logModeratorAction('delete', 'user', userId);
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId} and associated data`);
    throw error;
  }
};

