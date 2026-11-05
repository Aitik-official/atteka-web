const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('c:/Software/Atteka/client-a-replica/src/app/(dashboard)/dashboard');
const findings = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    const trimmed = l.trim();
    if (
      trimmed.includes('href="#"') ||
      trimmed.includes("href='#'") ||
      trimmed.includes('href=""') ||
      trimmed.includes("href=''") ||
      trimmed.includes('onClick={() => {}}') ||
      trimmed.includes('onClick={() => {') && trimmed.includes('}}') ||
      trimmed.includes('javascript:void(0)')
    ) {
      findings.push({
        file: path.relative('c:/Software/Atteka/client-a-replica', f),
        line: i + 1,
        text: trimmed
      });
    }
  });
});

console.log('Total dummy/empty handlers found:', findings.length);
findings.forEach(item => {
  console.log(`${item.file}:${item.line} -> ${item.text}`);
});

