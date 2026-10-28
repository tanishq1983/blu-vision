import fs from 'node:fs';
fs.writeFileSync('C:/Users/tanis/blu-visual-teacher/tts-test-input.json', JSON.stringify({text: 'Python loops repeat code blocks efficiently.', lang: 'en', model_dir: 'C:/Users/tanis/blu-visual-teacher/data/models/mms-tts-eng'}));
console.log('written');