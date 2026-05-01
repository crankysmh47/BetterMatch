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

SECTIONS.forEach((sec) => {
  sec.tasks.forEach((g) => {
    g.items.forEach((_item, idx) => {
      console.log(`${sec.id}_${g.group}_${idx}`);
    });
  });
});
