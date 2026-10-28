import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/index.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/kn: '.*?for ಲೂಪ್ ಬಳಸಿ\./, "kn: 'ಕ್ರಮದಂತೆ ಪುನರಾವರ್ತಿಸಲು for ಲೂಪ್ ಬಳಸಿ.'");
fs.writeFileSync(p, c, 'utf8');
console.log('done');