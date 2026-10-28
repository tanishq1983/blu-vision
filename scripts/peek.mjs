import fs from 'node:fs';
const c = fs.readFileSync('C:/Users/tanis/blu-visual-teacher/server/index.ts', 'utf8');
const i = c.indexOf("status: 'failed'");
console.log(JSON.stringify(c.slice(i - 10, i + 220)));