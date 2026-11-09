import fs from "fs";
import path from "path";

const root = path.resolve("src/app/(dashboard)/dashboard");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === "page.tsx") out.push(p);
  }
  return out;
}

const re =
  /\r?\n\s*<div className="flex flex-wrap items-center gap-1 text-\[12px\]">[\s\S]*?<span className="text-\[#0171d3\] font-medium">[\s\S]*?<\/span>\s*<\/div>\r?\n/;

let changed = 0;
for (const f of walk(root)) {
  const s = fs.readFileSync(f, "utf8");
  if (!re.test(s)) continue;
  const next = s.replace(re, "\n");
  if (next !== s) {
    fs.writeFileSync(f, next);
    changed++;
    console.log("stripped", path.relative(root, f));
  }
}
console.log("changed", changed);
