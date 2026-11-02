// scripts/extractLegacyDocs.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedPath = path.resolve(__dirname, '../src/db/seedServices.ts');
const content = fs.readFileSync(seedPath, 'utf-8');

// Parse the items in SEED_SERVICES
const regex = /id:\s*'([^']+)'[\s\S]*?markdownDoc:\s*(`[\s\S]*?`),\s*\n\s*},/g;
let match;
const docs = {};
while ((match = regex.exec(content)) !== null) {
  docs[match[1]] = match[2];
}

console.log('Extracted docs count:', Object.keys(docs).length);

const outLines = [
  '// src/db/legacyCustomDocs.ts',
  '// Hand-crafted custom documentation for foundational AWS services',
  '',
  'export const CUSTOM_LEGACY_DOCS: Record<string, string> = {',
];
for (const [id, md] of Object.entries(docs)) {
  outLines.push(`  ${JSON.stringify(id)}: ${md},`);
}
outLines.push('};', '', 'export default CUSTOM_LEGACY_DOCS;\n');

const outPath = path.resolve(__dirname, '../src/db/legacyCustomDocs.ts');
fs.writeFileSync(outPath, outLines.join('\n'), 'utf-8');
console.log('Successfully wrote:', outPath);

