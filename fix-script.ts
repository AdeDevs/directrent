import fs from 'fs';
let content = fs.readFileSync('src/components/ChatModal.tsx', 'utf8');

content = content.replace(/const agentDoc = await getDoc\(doc\(db, 'users', agentId\)\);\s*if \(agentDoc\.exists\(\)\) {\s*agentImage = agentDoc\.data\(\)\.avatarUrl \|\| '';\s*}/g, `const agentRes = await fetch('/api/public/users/' + agentId);
          if (agentRes.ok) {
            const agentDoc = await agentRes.json();
            agentImage = agentDoc.data?.avatarUrl || '';
          }`);

fs.writeFileSync('src/components/ChatModal.tsx', content);
