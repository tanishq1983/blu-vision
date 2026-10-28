import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/index.ts';
let c = fs.readFileSync(p, 'utf8');
const start = c.indexOf('const demoLesson: Lesson = {');
const demosAnchor = c.indexOf("app.get('/api/demos'");
if (start < 0 || demosAnchor < 0) { console.log('anchors not found', start, demosAnchor); process.exit(1); }
const end = c.lastIndexOf('};', demosAnchor);
if (end < 0) { console.log('end not found'); process.exit(1); }
const replacement = `const demoLesson: Lesson = {
  schema_version: '1.0', lesson_id: 'demo-python-loops', topic: 'Python Loops', level: 'beginner',
  scenes: [
    { id: 'intro', component: 'title_card', title: { en: 'Python Loops', hi: 'Python लूप्स', kn: 'Python ಲೂಪ್‌ಗಳು' }, narration: { en: 'Python loops repeat code blocks efficiently.', hi: 'Python लूप्स कोड ब्लॉक्स को दोहराते हैं.', kn: 'Python ಲೂಪ್‌ಗಳು ಪುನರಾವರ್ತಿಸಿ.' }, props: { subtitle: { en: 'For and while loops', hi: 'for और while लूप', kn: 'for ಮತ್ತು while ಲೂಪ್‌ಗಳು' } } },
    { id: 'for', component: 'bullet_reveal', title: { en: 'For Loop', hi: 'for लूप', kn: 'for ಲೂಪ್' }, narration: { en: 'Iterate over a sequence with for loops.', hi: 'क्रम पर पुनरावृति करने के लिए for लूप का उपयोग करें.', kn: 'ಕ್ರಮದಂತೆ ಪುನರಾವರ್ತಿಸಲು for ಲೂಪ್ ಬಳಸಿ.' }, props: { items: [{ en: 'for i in range(5): print(i)', hi: 'for i in range(5): print(i)', kn: 'for i in range(5): print(i)' }, { en: 'Indentation defines the loop body.', hi: 'इंडेंटेशन लूप बॉडी को परिभाषित करता है.', kn: 'ಇಂಡೆಂಟೇಶನ್ ಲೂಪ್ ದೇಹವನ್ನು ವ್ಯಾಖ್ಯಾನಿಸುತ್ತದೆ.' }] } },
    { id: 'while', component: 'bullet_reveal', title: { en: 'While Loop', hi: 'while लूप', kn: 'while ಲೂಪ್' }, narration: { en: 'Repeat while a condition stays true.', hi: 'शर्त सत्य रहने तक दोहराएं.', kn: 'ಶর্ত ಸತ್ಯ ಇರುವವರೆಗೆ ಪುನರಾವರ್ತಿಸಿ.' }, props: { items: [{ en: 'while condition: do_work()', hi: 'while condition: do_work()', kn: 'while condition: do_work()' }, { en: 'Update state to avoid infinite loops.', hi: 'अनंत लूप से बचने के लिए स्थिति अद्यतन करें.', kn: 'ಅನಂತ ಲೂಪ್ ತಪ್ಪಿಸಲು ಸ್ಥಿತಿಯನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡಿ.' }] } },
  ],
  media: {}, timeline: {}, meta: { model: 'prebuilt', fallback: true, generated_at: new Date().toISOString() },
};`;
c = c.slice(0, start) + replacement + c.slice(end + 2);
fs.writeFileSync(p, c, 'utf8');
console.log('demo lesson rewritten OK');