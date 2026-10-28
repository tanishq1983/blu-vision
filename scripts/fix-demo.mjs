import fs from 'node:fs';
const p = 'C:/Users/tanis/blu-visual-teacher/server/index.ts';
let c = fs.readFileSync(p, 'utf8');
const nar = (en, hi, kn) => ` narration: { en: ${JSON.stringify(en)}, hi: ${JSON.stringify(hi)}, kn: ${JSON.stringify(kn)} },`;
c = c.replace("title: { en: 'Python Loops', hi: 'Python लूप्स', kn: 'Python ಲೂಪ್‌ಗಳು' },", "title: { en: 'Python Loops', hi: 'Python लूप्स', kn: 'Python ಲೂಪ್‌ಗಳು' }," + nar('Python loops repeat code blocks efficiently.', 'Python लूप्स कोड ब्लॉक्स को दोहराते हैं.', 'Python ಲೂಪ್‌ಗಳು ಕೋಡ್ ಬ್ಲಾಕ್‌ಗಳನ್ನು ಪುನರಾವರ್ತಿಸುತ್ತವೆ.'));
c = c.replace("title: { en: 'For Loop', hi: 'for लूप', kn: 'for ಲೂಪ್' },", "title: { en: 'For Loop', hi: 'for लूप', kn: 'for ಲೂಪ್' }," + nar('Iterate over a sequence with for loops.', 'क्रम पर पुनरावृति करने के लिए for लूप का उपयोग करें.', 'ಕ್ರಮದಂತೆ ಪುನರಾವರ್ತಿಸಲು for ಲೂಪ್ ಬಳಸಿ.'));
c = c.replace("title: { en: 'While Loop', hi: 'while लूप', kn: 'while ಲೂಪ್' },", "title: { en: 'While Loop', hi: 'while लूप', kn: 'while ಲೂಪ್' }," + nar('Repeat while a condition stays true.', 'शर्त सत्य रहने तक दोहराएं.', 'ಶর্ত ಸತ್ಯ ಇರುವವರೆಗೆ ಪುನರಾವರ್ತಿಸಿ.'));
console.log('demo narration inserted');
fs.writeFileSync(p, c, 'utf8');