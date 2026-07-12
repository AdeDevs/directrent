import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/Approvals.tsx', 'utf8');

const importReplacement = `import { createNotification } from '../../lib/notifications';\nimport { \n  ShieldCheck, `;
content = content.replace('import { \n  ShieldCheck, ', importReplacement);

const funcReplacement = `  // Removed local createNotification`;
content = content.replace(/  const createNotification = async \(userId: string, title: string, message: string, type: 'verification' \| 'listing' \| 'system'\) => \{\s+try \{\s+await addDoc\(collection\(db, 'notifications'\), \{\s+userId,\s+title,\s+message,\s+type,\s+read: false,\s+createdAt: serverTimestamp\(\)\s+\}\);\s+\} catch \(err\) \{\s+console.error\("Error creating notification:", err\);\s+\}\s+\};\n/, funcReplacement + '\n');

fs.writeFileSync('src/pages/admin/Approvals.tsx', content);
console.log("Fixed Approvals.tsx");
