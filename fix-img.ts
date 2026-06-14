import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (file: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('src', (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content.replace(/<img(.*?)\/?>/g, (match, body) => {
      if (body.includes('referrerPolicy')) return match;
      if (body.endsWith('/')) body = body.slice(0, -1);
      return `<img${body} referrerPolicy="no-referrer" />`;
    });
    if (newContent !== content) {
      fs.writeFileSync(filepath, newContent);
    }
  }
});
