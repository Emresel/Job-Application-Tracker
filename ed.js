const fs = require('fs');
let content = fs.readFileSync(process.argv[2], 'utf8');
content = content.replace(/Co-authored-by: Cursor.*/g, '');
fs.writeFileSync(process.argv[2], content);
