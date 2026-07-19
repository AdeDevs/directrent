const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace getFilename and getDirname and the calls with nothing
const pattern = /const getFilename = \(\) => \{[\s\S]*?const _dirname = getDirname\(\);/;

code = code.replace(pattern, '');

fs.writeFileSync('server.ts', code);
