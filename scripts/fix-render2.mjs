import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/render.ts';
const lines = fs.readFileSync(p, 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const entries =')) {
    lines[i] = "  const entries = [...Array(n).keys()].map(i => 'file \\'' + esc(path.join(frameDir, 'frame-' + String(i).padStart(5, '0') + '.png')) + '\\''\\nduration 0.041667').join('') + 'file \\'' + esc(path.join(frameDir, 'frame-' + String(n - 1).padStart(5, '0') + '.png')) + '\\''\\n';";
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('entries line fixed');