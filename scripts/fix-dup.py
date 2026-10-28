import json
import re

filepath = "C:/Users/tanis/blu-visual-teacher/data/lessons/demo-python-loops.json"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the duplicate for-loop scene (has leftover subtitle content)
# Match the pattern: scene with id=for-loop containing subtitle
old_scene = '''    {
      

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
    },'''

new_scene = '''    {
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
    },'''

if old_scene in content:
    content = content.replace(old_scene, new_scene)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed: Removed duplicate for-loop scene")
else:
    print("Error: Old scene not found")
    # Show the area around the duplicate
    lines = content.split("\n")
    for i, line in enumerate(lines[48:70], start=49):
        print(f"{i}: {line}")
