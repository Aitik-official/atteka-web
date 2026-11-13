import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Inline a minimal copy of resolve logic by importing compiled TS is hard;
// instead list pages and compare segments against known maps by reading breadcrumbs.ts text.

const root = path.resolve("src/app/(dashboard)/dashboard");
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === "page.tsx") acc.push(p);
  }
  return acc;
}

const pages = walk(root)
  .map((p) => {
    const rel = path.relative(root, p).replace(/\\/g, "/").replace(/\/page\.tsx$/, "");
    return "/dashboard" + (rel ? "/" + rel : "");
  })
  .sort();

const crumbSrc = fs.readFileSync("src/lib/breadcrumbs.ts", "utf8");
const segmentMatches = [...crumbSrc.matchAll(/"([^"]+)":\s*"/g)].map((m) => m[1]);
const knownSegs = new Set(segmentMatches);

const missingSegs = new Map();
for (const route of pages) {
  const parts = route.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  for (const seg of parts) {
    if (seg.startsWith("[") && seg.endsWith("]")) continue;
    if (!knownSegs.has(seg) && !crumbSrc.includes(`"${seg}"`)) {
      if (!missingSegs.has(seg)) missingSegs.set(seg, []);
      missingSegs.get(seg).push(route);
    }
  }
}

console.log("PAGES", pages.length);
console.log("MISSING_SEGMENT_KEYS", missingSegs.size);
for (const [seg, routes] of [...missingSegs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`- ${seg} (${routes.length}) e.g. ${routes[0]}`);
}

// hubs that pages sit under but may 404
const hubs = new Set();
for (const route of pages) {
  const parts = route.split("/").filter(Boolean);
  for (let i = 2; i < parts.length; i++) {
    hubs.add("/" + parts.slice(0, i).join("/"));
  }
}
const pageSet = new Set(pages);
const missingHubs = [...hubs].filter((h) => !pageSet.has(h) && !h.includes("[")).sort();
console.log("MISSING_PARENT_HUB_PAGES", missingHubs.length);
missingHubs.forEach((h) => console.log("  " + h));
