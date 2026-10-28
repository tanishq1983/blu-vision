import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/index.ts';
let c = fs.readFileSync(p, 'utf8');
const outer = `    } catch (e: any) { setJob(jobId, { status: 'failed', error: e.message }); res.status(500).json({ error: e.message }); });
`;
if (!c.includes(outer)) {
  c = c.replace(/    \} catch \(e: any\) \{ setJob\(jobId, \{ status: 'failed', error: e\.message \}\); res\.status\(500\)\.json\(\{ error: e\.message \}\);\n\}\);/, outer);
  fs.writeFileSync(p, c, 'utf8');
  console.log('index.ts fixed');
}
const p2 = 'C:/Users/tanis/blu-visual-teacher/server/render.ts';
let c2 = fs.readFileSync(p2, 'utf8');
const lines2 = c2.split('\n');
const k = lines2.findIndex(x => x.startsWith('  const entries ='));
if (k >= 0) {
  lines2[k] = `  const entries = [...Array(n).keys()].map(i => "file '" + esc(path.join(frameDir, 'frame-' + String(i).padStart(5, '0') + '.png')) + "'\\n").join('') + "file '" + esc(path.join(frameDir, 'frame-' + String(n - 1).padStart(5, '0') + '.png')) + "'\\n";`;
  c2 = lines2.join('\n');
  fs.writeFileSync(p2, c2, 'utf8');
  console.log('render.ts fixed');
} else {
  console.log('render.ts entries line not found');
}