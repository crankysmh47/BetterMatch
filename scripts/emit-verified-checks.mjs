/**
 * Emits task ID list — keep triples in sync with CODEBASE_VERIFIED_MARKERS in genalign_full_spec.html.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'spec', 'genalign_full_spec.html'),
  'utf8',
);
const i = html.indexOf('const SECTIONS = ');
const j = html.indexOf('function countTasks', i);
const blob = html.slice(i + 'const SECTIONS = '.length, j).trim();
const SECTIONS = Function('"use strict"; return ' + blob)();

function id(sIdx, tIdx, itemIdx) {
  const sec = SECTIONS[sIdx];
  const tg = sec.tasks[tIdx];
  return `${sec.id}_${tg.group}_${itemIdx}`;
}

/** @type {Array<[number, number, number[]]>} */
const triples = [
  [0, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
  [0, 1, [0, 1, 2, 3, 4]],
  [1, 0, [0, 1, 2, 3, 4, 5]],
  [1, 1, [0, 1, 2, 3, 4, 5, 6, 7]],
  [1, 2, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  [2, 0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
  [2, 1, [0, 1, 2, 3, 4, 5, 6, 7]],
  [2, 2, [0, 1, 2, 3, 4, 5, 6, 7]],
  [2, 3, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
  [2, 4, [0, 1, 2, 3, 4, 5, 6]],
  [2, 5, [0, 1, 2, 3]],
  [3, 0, [0, 1, 2]],
  [3, 1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
  [3, 2, [0, 1, 2]],
  [3, 3, [0, 1, 2]],
  [
    4,
    0,
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  ],
  [4, 1, [0, 1, 2]],
  [5, 0, [0, 1, 2, 3]],
  [5, 1, [0, 1, 2, 3, 4, 5]],
  [5, 2, [0, 1]],
  [5, 3, [0, 1]],
  [6, 0, [0, 1, 2, 3, 4]],
  [6, 1, [0, 1]],
  [6, 2, [0, 1]],
  [7, 0, [0, 1, 2, 3, 4]],
  [8, 0, [0, 1, 2, 3, 4, 5]],
  [8, 1, [0, 1, 2, 3]],
  [8, 2, [0, 1]],
  [9, 0, [0, 1, 2, 3, 4, 5, 6]],
  [9, 1, [0, 1, 2]],
  [9, 2, [0, 1, 2, 3, 4]],
  [10, 0, [4]],
  [10, 1, [0]],
];

const ids = [];
for (const [si, ti, iis] of triples) {
  for (const ii of iis) ids.push(id(si, ti, ii));
}

console.log('// Auto-generated verified count:', ids.length);
console.log('const CODEBASE_VERIFIED_TASK_IDS = [');
console.log(ids.map((x) => `  '${x.replace(/'/g, "\\'")}',`).join('\n'));
console.log('];');
