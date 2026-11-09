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

const re = /\r?\n\s*breadcrumbs=\{\[[\s\S]*?\]\}\s*,?/g;

let changed = 0;
for (const f of walk(root)) {
  const s = fs.readFileSync(f, "utf8");
  if (!re.test(s)) continue;
  const next = s.replace(re, "\n");
  if (next !== s) {
    fs.writeFileSync(f, next);
    changed++;
    console.log("stripped breadcrumbs prop", path.relative(root, f));
  }
}
console.log("changed", changed);
