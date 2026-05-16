import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export const logModeratorAction = async (
  actionType: 'approve' | 'reject' | 'delete' | 'suspend',
  targetType: 'listing' | 'agent' | 'user',
  targetId: string,
  details: any = {}
) => {
  const user = auth.currentUser;
  
  try {
    await addDoc(collection(db, 'moderatorLogs'), {
      moderatorId: user?.uid || 'system',
      modEmail: user?.email || 'system',
      action: actionType,
      targetType,
      targetId,
      details,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error logging moderator action:", err);
  }
};
