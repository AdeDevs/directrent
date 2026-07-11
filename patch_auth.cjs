const fs = require('fs');
const content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const setupFn = `
  const setupPushNotifications = async (userId: string) => {
    try {
      if (!('Notification' in window)) return;
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const msg = await messaging();
        if (msg) {
          const token = await getToken(msg, { vapidKey: 'BOPY_19AIXAx6Db1zKISMjdF8emGfEO-T6N1yrJuCPwad6tLY3iVBDrSMgKUYBS6pMMLT4VIpfIFF7xiWeB3Jfs' });
          if (token) {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              fcmTokens: FieldValue ? undefined : null // Just a placeholder to get FieldValue, we'll import arrayUnion
            });
          }
        }
      }
    } catch (e) {
      console.warn('Push notification setup failed:', e);
    }
  };
`;

// wait, I need to add arrayUnion to firestore imports
let newContent = content.replace('updateDoc, FieldValue,', 'updateDoc, FieldValue, arrayUnion,');

// insert setupPushNotifications inside the AuthProvider component, before useEffects
newContent = newContent.replace('const [minTimeElapsed, setMinTimeElapsed] = useState(false);', `const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const setupPushNotifications = async (userId: string) => {
    try {
      if (!('Notification' in window)) return;
      
      const msg = await messaging();
      if (!msg) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(msg, { vapidKey: 'BOPY_19AIXAx6Db1zKISMjdF8emGfEO-T6N1yrJuCPwad6tLY3iVBDrSMgKUYBS6pMMLT4VIpfIFF7xiWeB3Jfs' });
        if (token) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
        }
      }
    } catch (e) {
      console.warn('Push notification setup failed:', e);
    }
  };
`);

newContent = newContent.replace('if (userData) {', `if (userData) {
            setupPushNotifications(firebaseUser.uid);`);

fs.writeFileSync('src/context/AuthContext.tsx', newContent);
