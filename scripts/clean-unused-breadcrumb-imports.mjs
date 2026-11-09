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

let changed = 0;
for (const f of walk(root)) {
  let s = fs.readFileSync(f, "utf8");
  const original = s;

  // If ChevronRight is imported but never used in JSX/body, drop it from lucide import
  const usesChevron = /<ChevronRight\b|\bChevronRight\./.test(s);
  if (!usesChevron && /\bChevronRight\b/.test(s)) {
    s = s
      .replace(/,?\s*ChevronRight\s*,?/g, (m) => {
        // keep commas tidy — handled below
        return ",";
      });
    // Clean import lines like: import { ArrowLeft, , FileSpreadsheet } from "lucide-react";
    s = s.replace(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']\s*;/g, (full, inner) => {
      const parts = inner
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .filter((p) => p !== "ChevronRight");
      if (!parts.length) return "";
      return `import { ${parts.join(", ")} } from "lucide-react";`;
    });
  }

  // Drop unused Link import if Link no longer appears
  const usesLink = /<Link\b|\bLink\./.test(s);
  if (!usesLink && /from ["']next\/link["']/.test(s)) {
    s = s.replace(/import\s+Link\s+from\s+["']next\/link["']\s*;\r?\n/, "");
  }

  if (s !== original) {
    fs.writeFileSync(f, s);
    changed++;
    console.log("cleaned imports", path.relative(root, f));
  }
}
console.log("changed", changed);
