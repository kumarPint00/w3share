#!/usr/bin/env node
/*
 Strips all
 WARNING: This is destructive. Make sure you have commits/backups.
*/
const fs = require('fs');
const path = require('path');

const exts = new Set(['.js','.jsx','.ts','.tsx','.json','.mjs','.cjs']);
const excludeDirs = new Set([
  'node_modules','dist','build','out','coverage','.git','.next','.turbo','.vercel',
  'artifacts','cache','.vscode','.idea','.husky','.pnpm','.yarn','.venv','.pytest_cache',
]);

function isBinaryFile(filePath) {
  const buf = fs.readFileSync(filePath);

  return buf.includes(0);
}

function stripLineComments(content, ext) {



  const lines = content.split(/\r?\n/);
  const out = [];
  for (let line of lines) {
    let i = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let escaped = false;
    let result = '';
    while (i < line.length) {
      const ch = line[i];
      const next = i + 1 < line.length ? line[i+1] : '';

      if (inSingle) {
        if (!escaped && ch === "'") inSingle = false;
        escaped = ch === '\\' && !escaped;
        result += ch;
        i++;
        continue;
      }
      if (inDouble) {
        if (!escaped && ch === '"') inDouble = false;
        escaped = ch === '\\' && !escaped;
        result += ch;
        i++;
        continue;
      }
      if (inTemplate) {
        if (!escaped && ch === '`') inTemplate = false;
        escaped = ch === '\\' && !escaped;
        result += ch;
        i++;
        continue;
      }


      if (ch === '"') { inDouble = true; result += ch; i++; continue; }
      if (ch === "'") { inSingle = true; result += ch; i++; continue; }
      if (ch === '`') { inTemplate = true; result += ch; i++; continue; }


      if (ch === '/' && next === '/') {
        const prev2 = result.slice(-6).toLowerCase();
        if (prev2.endsWith('http:') || prev2.endsWith('https:')) {

          result += '//';
          i += 2;
          continue;
        }

        break;
      }

      result += ch;
      i++;
    }
    out.push(result.trimEnd());
  }
  return out.join('\n');
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else {
      const ext = path.extname(entry.name);
      if (!exts.has(ext)) continue;
      try {
        if (isBinaryFile(full)) return;
      } catch (e) {

        return;
      }
      const orig = fs.readFileSync(full, 'utf8');
      const stripped = stripLineComments(orig, ext);
      if (stripped !== orig) {
        fs.writeFileSync(full, stripped, 'utf8');
        console.log(`Stripped comments: ${full}`);
      }
    }
  }
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  walk(root);
}

if (require.main === module) main();
