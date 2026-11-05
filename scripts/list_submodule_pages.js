const fs = require('fs');

const invPath = 'C:\\Users\\kitty\\.gemini\\antigravity\\brain\\ac0fa10f-99fc-484c-91e3-140a0770b722\\scratch\\crawl_data\\all_pages_inventory.json';
const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

console.log('Total Subcategories in Inventory:', Object.keys(inventory).length);
for (const [code, data] of Object.entries(inventory)) {
  console.log(`\nSubmodule [${code}] ${data.title}: ${data.cards.length} items`);
  data.cards.forEach(c => {
    console.log(`   - [${c.code || 'N/A'}] ${c.title} -> ${c.url}`);
  });
}

