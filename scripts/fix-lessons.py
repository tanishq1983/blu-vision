import json

filepath = "C:/Users/tanis/blu-visual-teacher/data/lessons/demo-python-loops.json"

with open(filepath, "r", encoding="utf-8") as f:
    data = json.load(f)

# Fix the for-loop scene
for Scene in data["scenes"]:
    if Scene["id"] == "for-loop":
        Scene["component"] = "bullet_reveal"
        Scene["props"] = {
            "items": [
                {"en": "for item in list:", "hi": "for item in सूची:", "kn": "for item in ಪಟ್ಟಿಯಲ್ಲಿ:"},
                {"en": "for i in range(n):", "hi": "for i in परिसर(n):", "kn": "for i in ವರ್ಗ(n):"},
                {"en": "for x, y in pairs:", "hi": "for x, y in जोड़ों में:", "kn": "for x, y in ಜೋಡಿಮಾಡುಗಳಲ್ಲಿ:"}
            ]
        }
    elif Scene["id"] == "while-loop":
        Scene["component"] = "bullet_reveal"
        Scene["props"] = {
            "items": [
                {"en": "while condition is true:", "hi": "जबकि शर्त सही है:", "kn": "ಷರತ್ತು ಸತ್ಯವಾಗಿರುವವರೆ:"},
                {"en": "the loop body executes", "hi": "लूप शरीर निष्पादित होता है", "kn": "ಲೂಪ್ ದೇಹವು ನಿರ್ವಹಿಸುತ್ತದೆ"},
                {"en": "condition becomes false", "hi": "शर्त झूठी हो जाती है", "kn": "ಷರತ್ತು ಸ್ವರూపವಾಗಿಸುತ್ತದೆ"},
                {"en": "loop exits", "hi": "लूप से बाहर निकलता है", "kn": "ಲೂಪ್ ನಿಂದ ನಿರ್ಗಮಿಸುತ್ತದೆ"}
            ]
        }

with open(filepath, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("Fixed: for-loop and while-loop now use bullet_reveal with items")
