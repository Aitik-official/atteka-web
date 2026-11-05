const fs = require('fs');
const path = require('path');

const menuTreePath = 'C:\\Users\\kitty\\.gemini\\antigravity\\brain\\ac0fa10f-99fc-484c-91e3-140a0770b722\\scratch\\crawl_data\\full_menu_tree.json';
const menuTree = JSON.parse(fs.readFileSync(menuTreePath, 'utf8'));

console.log('=== SCRAPED MAIN WEBSITE MODULES & SUBCATEGORIES ===');
menuTree.resultTree.forEach(mod => {
  console.log(`\nMain Module: [${mod.menuId}] ${mod.menuName} (Subcategories: ${mod.items.length})`);
  mod.items.forEach(sub => {
    console.log(`   - [${sub.MenuID}] ${sub.Menudesc} -> ${sub.NavigationURL}`);
  });
});

