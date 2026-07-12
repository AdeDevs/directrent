import fs from 'fs';
let content = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf8');

const targetStr = `if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {`;
const replacementStr = `if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && (user as any)?.fcmTokens?.length > 0) {`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/layouts/AppLayout.tsx', content);
console.log("Fixed AppLayout");
