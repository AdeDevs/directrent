const fs = require('fs');
let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// 1. imports
content = content.replace(
  'import { auth, storage, db } from "../lib/firebase";',
  'import { auth, storage, db, messaging } from "../lib/firebase";\nimport { getToken } from "firebase/messaging";'
);
content = content.replace(
  'addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";',
  'addDoc, serverTimestamp, deleteDoc, arrayUnion } from "firebase/firestore";'
);

// 2. handleTogglePushNotifications inside Profile component
const pushToggleFn = `
  const handleTogglePushNotifications = async () => {
    if (!user) return;
    try {
      const isEnabled = (user as any).fcmTokens && (user as any).fcmTokens.length > 0;
      const msg = await messaging();
      if (!msg) {
        toast.error("Push notifications are not supported on this browser.");
        return;
      }
      
      if (isEnabled) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          fcmTokens: deleteField()
        });
        toast.success("Push notifications disabled");
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(msg, { vapidKey: 'BOPY_19AIXAx6Db1zKISMjdF8emGfEO-T6N1yrJuCPwad6tLY3iVBDrSMgKUYBS6pMMLT4VIpfIFF7xiWeB3Jfs' });
          if (token) {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
            toast.success("Push notifications enabled");
          } else {
            toast.error("Failed to get notification token");
          }
        } else {
          toast.error("Permission denied for notifications");
        }
      }
    } catch (err) {
      console.error("Push notification toggle error:", err);
      toast.error("Failed to toggle push notifications");
    }
  };
`;

content = content.replace(
  '  const handleToggleTheme = () => {',
  pushToggleFn + '\n  const handleToggleTheme = () => {'
);

// 3. Render the toggle button
const toggleJSX = `
            {/* Push Notifications Toggle */}
            <div 
              onClick={handleTogglePushNotifications}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group cursor-pointer"
            >
              <div className={\`w-10 h-10 \${(user as any)?.fcmTokens?.length > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/55 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 border border-slate-200/55 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'} rounded-2xl flex items-center justify-center group-active:scale-95 transition-all duration-300\`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Push Notifications</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Receive alerts even when away</p>
              </div>
              <div 
                className={\`w-11 h-6 \${(user as any)?.fcmTokens?.length > 0 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'} rounded-full flex items-center px-1 transition-all duration-300 relative\`}
              >
                <motion.div 
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  animate={{ x: (user as any)?.fcmTokens?.length > 0 ? 20 : 0 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </div>
            </div>
`;

content = content.replace(
  '{/* Theme Toggle Button */}',
  toggleJSX + '\n            {/* Theme Toggle Button */}'
);

fs.writeFileSync('src/pages/Profile.tsx', content);
