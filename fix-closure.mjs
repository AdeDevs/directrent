import fs from 'fs';
let content = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf8');

// Add useRef to React imports if not present
if (!content.includes('useRef')) {
  content = content.replace('useState, useEffect, lazy, Suspense', 'useState, useEffect, lazy, Suspense, useRef');
}

const matchStr = `} = useAuth();`;
const replaceStr = `} = useAuth();\n  const userRef = useRef(user);\n  useEffect(() => {\n    userRef.current = user;\n  }, [user]);`;
if (content.includes(matchStr)) {
  content = content.replace(matchStr, replaceStr);
}

// Replace the stale reference in the useEffect
content = content.replace(`if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && (user as any)?.fcmTokens?.length > 0) {`, `if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && (userRef.current as any)?.fcmTokens?.length > 0) {`);

fs.writeFileSync('src/layouts/AppLayout.tsx', content);
console.log("Fixed AppLayout");
