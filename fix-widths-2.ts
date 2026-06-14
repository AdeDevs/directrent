import fs from 'fs';
const files = [
  'src/components/KYCVerification.tsx',
  'src/components/TrustVerification.tsx',
  'src/pages/admin/AdminDashboard.tsx',
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/ w-full max-w-([a-z0-9]+)/g, ' w-full max-w-full sm:max-w-$1');
    content = content.replace(/\"w-full max-w-([a-z0-9]+)/g, '\"w-full max-w-full sm:max-w-$1');
    fs.writeFileSync(file, content);
  }
});
console.log('done replacing phase 2');
