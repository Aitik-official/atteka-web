import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

// Dynamically load TS via tsx register if available — fallback: spawn note
const { register } = await import("node:module");
try {
  await import("tsx/esm/api").then((m) => m.register?.());
} catch {
  // ignore
}

const { resolveBreadcrumbs } = await import(
  pathToFileURL(path.resolve("src/lib/breadcrumbs.ts")).href
);

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
    const route = "/dashboard" + (rel ? "/" + rel : "");
    return route.replace(/\[id\]/g, "SAMPLE123").replace(/\[slug\]/g, "sample-slug");
  })
  .sort();

const empty = [];
const badParents = [];
const samples = {};

for (const route of pages) {
  if (route === "/dashboard") continue;
  const crumbs = resolveBreadcrumbs(route);
  if (!crumbs.length) empty.push(route);
  // parents should have href; last should not
  crumbs.forEach((c, i) => {
    const isLast = i === crumbs.length - 1;
    if (!isLast && !c.href) badParents.push({ route, label: c.label });
    if (isLast && c.href) badParents.push({ route, label: c.label, issue: "leaf-has-href" });
  });
  if (
    route.includes("company-structure") ||
    route.includes("edit-billing-party") ||
    route.includes("dockets/SAMPLE") ||
    route.endsWith("/admin")
  ) {
    samples[route] = crumbs;
  }
}

const out = {
  totalNonHome: pages.length - 1,
  emptyCount: empty.length,
  empty,
  badParentsCount: badParents.length,
  badParents: badParents.slice(0, 30),
  samples
};
fs.writeFileSync("scripts/breadcrumb-audit-result.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
