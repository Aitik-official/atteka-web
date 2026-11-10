const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const skipRel = new Set([
  "lib/printEngine.ts",
  "lib/billPrintFormats.ts",
  "lib/pdcPrintFormats.ts"
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function stripTemplates(src) {
  return src.replace(/`[\s\S]*?`/g, "``");
}

function ensureImport(src) {
  if (/import\s*\{[^}]*\bprintScoped\b[^}]*\}\s*from\s*["']@\/lib\/printEngine["']/.test(src)) {
    return src;
  }
  if (/from\s*["']@\/lib\/printEngine["']/.test(src)) {
    return src.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/printEngine["']\s*;/,
      (m, names) => {
        if (/\bprintScoped\b/.test(names)) return m;
        return `import { printScoped,${names} } from "@/lib/printEngine";`;
      }
    );
  }
  if (/from\s*["']@\/lib\/toastBus["']/.test(src)) {
    return src.replace(
      /(import\s*\{[^}]*\}\s*from\s*["']@\/lib\/toastBus["']\s*;)/,
      `$1\nimport { printScoped } from "@/lib/printEngine";`
    );
  }
  const firstImport = src.match(/^import .*?;/m);
  if (firstImport) {
    return src.replace(
      firstImport[0],
      `${firstImport[0]}\nimport { printScoped } from "@/lib/printEngine";`
    );
  }
  return `import { printScoped } from "@/lib/printEngine";\n${src}`;
}

function addPrintRoot(src) {
  if (/data-print-root/.test(src)) return src;
  let next = src;
  next = next.replace(
    /\{step === "report" && \(\s*\n(\s*)<div className="/g,
    '{step === "report" && (\n$1<div data-print-root className="'
  );
  next = next.replace(
    /\{step === "list" && \(\s*\n(\s*)<div className="/g,
    '{step === "list" && (\n$1<div data-print-root className="'
  );
  return next;
}

const files = walk(root);
const report = [];
let changed = 0;

for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, "/");
  if (skipRel.has(rel)) continue;

  const txt = fs.readFileSync(f, "utf8");
  if (!/window\.print\(/.test(txt)) continue;

  const codeOnly = stripTemplates(txt);
  if (!/window\.print\(/.test(codeOnly)) {
    report.push(`SKIP(template-only): ${rel}`);
    continue;
  }

  let next = txt;
  next = next.replace(/onClick=\{\(\) => window\.print\(\)\}/g, "onClick={() => printScoped()}");
  next = next.replace(
    /onClick=\{\(\) =>\s*\{\s*window\.print\(\);\s*\}\}/g,
    "onClick={() => printScoped()}"
  );
  next = next.replace(
    /const printReport = \(\) => window\.print\(\);/g,
    "const printReport = () => printScoped();"
  );
  next = next.replace(
    /const printTable = \(\) => \{\s*window\.print\(\);\s*\};/g,
    "const printTable = () => {\n    printScoped();\n  };"
  );
  next = next.replace(/^([ \t]*)window\.print\(\);[ \t]*$/gm, "$1printScoped();");

  // Remaining non-template window.print() calls (preserve template-string ones)
  {
    let out = "";
    let i = 0;
    while (i < next.length) {
      const ch = next[i];
      if (ch === "`") {
        out += ch;
        i += 1;
        while (i < next.length) {
          if (next[i] === "\\") {
            out += next[i] + (next[i + 1] || "");
            i += 2;
            continue;
          }
          out += next[i];
          if (next[i] === "`") {
            i += 1;
            break;
          }
          i += 1;
        }
        continue;
      }
      if (next.startsWith("window.print()", i)) {
        out += "printScoped()";
        i += "window.print()".length;
        continue;
      }
      out += ch;
      i += 1;
    }
    next = out;
  }

  if (next === txt) {
    report.push(`NOCHANGE: ${rel}`);
    continue;
  }

  next = ensureImport(next);
  next = addPrintRoot(next);
  fs.writeFileSync(f, next);
  changed += 1;
  report.push(`PATCHED: ${rel}`);
}

console.log(report.join("\n"));
console.log(`\nChanged files: ${changed}`);
