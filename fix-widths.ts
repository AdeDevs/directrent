import fs from 'fs';
const files = [
  'src/pages/ListingDetails.tsx',
  'src/pages/Wallet.tsx',
  'src/components/ChatModal.tsx',
  'src/pages/Profile.tsx',
  'src/pages/AgentProfile.tsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/className="w-full max-w-([a-z0-9]+) /g, 'className="w-full max-w-full sm:max-w-$1 ');
  content = content.replace(/className="relative w-full max-w-([a-z0-9]+) /g, 'className="relative w-full max-w-full sm:max-w-$1 ');
  content = content.replace(/className="bg-white dark:bg-slate-900 w-full max-w-([a-z0-9]+) /g, 'className="bg-white dark:bg-slate-900 w-full max-w-full sm:max-w-$1 ');

  fs.writeFileSync(file, content);
});
console.log('done replacing');
