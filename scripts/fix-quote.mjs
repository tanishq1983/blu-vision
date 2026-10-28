import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/index.ts';
const lines = fs.readFileSync(p, 'utf8').split('\n');
const l = lines[34];
lines[34] = l.slice(0, 127) + l.slice(128);
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('fixed', JSON.stringify(lines[34].slice(120, 132)));