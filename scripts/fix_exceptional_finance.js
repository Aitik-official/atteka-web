const fs = require('fs');
const filePath = 'c:/Software/Atteka/client-a-replica/src/app/(dashboard)/dashboard/exceptional/finance/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all href="#" with empty string
content = content.replace(/\s*href="#"/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed all href="#" from exceptional/finance/page.tsx');

