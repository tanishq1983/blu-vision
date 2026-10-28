const fs = require("fs");

const filepath = "C:/Users/tanis/blu-visual-teacher/data/lessons/demo-python-loops.json";
let content = fs.readFileSync(filepath, "utf8");

// Remove the duplicate scene: from 'for-loop' scene with leftover subtitle
const oldScene = `    {
  

      "id": "for-loop",
      "component": "bullet_reveal",
      "title": {
        "en": "The For Loop",
        "hi": "For लूप",
        "kn": "For ಲೂಪ್"
      },
      "narration": {
        "en": "A for loop repeats an action for each item in a sequence.",
        "hi": "For लूप किसी क्रम की हर वस्तु के लिए एक क्रिया दोहराता है।",
        "kn": "For ಲೂಪ್ ಒಂದು ಕ್ರಮದಲ್ಲಿರುವ ಪ್ರತಿಯೊಂದು ಅಂಶಕ್ಗೂ ಕ್ರಿಯೆಯನ್ನು ಪುನರಾವರ್ತಿಸುತ್ತದೆ."
      },
      

        "hi": "हर वस्तु के लिए दोहराएँ",
        "kn": "ಪ್ರತಿಯೊಂದು ಅಂಶಕ್ಗೂ ಪುನರಾವರ್ತಿಸಿ"
      }
    },`;

const newScene = `    {
      "id": "for-loop",
      "component": "bullet_reveal",
      "title": {
        "en": "The For Loop",
        "hi": "For लूप",
        "kn": "For ಲೂಪ್"
      },
      "narration": {
        "en": "A for loop repeats an action for each item in a sequence.",
        "hi": "For लूप किसी क्रम की हर वस्तु के लिए एक क्रिया दोहराता है।",
        "kn": "For ಲೂಪ್ ಒಂದು ಕ್ರಮದಲ್ಲಿರುವ ಪ್ರತಿಯೊಂದು ಅಂಶಕ್ಗೂ ಕ್ರಿಯೆಯನ್ನು ಪುನರಾವರ್ತಿಸುತ್ತದೆ."
      },
      "props": {
        "items": [
          { "en": "for item in list:", "hi": "for item in सूची:", "kn": "for item in ಪಟ್ಟಿಯಲ್ಲಿ:" },
          { "en": "for i in range(n):", "hi": "for i in परिसर(n):", "kn": "for i in ವರ್ಗ(n):" },
          { "en": "for x, y in pairs:", "hi": "for x, y in जोड़ों में:", "kn": "for x, y in ಜೋಡಿಮಾಡುಗಳಲ್ಲಿ:" }
        ]
      }
    },`;

if (content.includes(oldScene)) {
  content = content.replace(oldScene, newScene);
  fs.writeFileSync(filepath, content, "utf8");
  console.log("Fixed duplicate for-loop scene");
} else {
  console.log("Old scene not found - may already be fixed");
}

// Validate JSON
try {
  const data = JSON.parse(content);
  const sceneIds = data.scenes.map(s => s.id);
  console.log("Scene IDs:", sceneIds);
  console.log("Validation: PASSED");
} catch(e) {
  console.log("Validation: FAILED -", e.message);
}
