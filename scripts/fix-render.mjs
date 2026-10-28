import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/render.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/import ffprobe from 'ffprobe-static';\n/, "import ffprobe from 'ffprobe-static';\nimport { RENDER_PAGE } from './render-page';\n");
const lines = c.split('\n');
const idx = lines.findIndex(x => x.startsWith('const RENDER_PAGE'));
if (idx >= 0) lines.splice(idx, 1);
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('render.ts fixed');