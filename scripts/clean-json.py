import json

filepath = "C:/Users/tanis/blu-visual-teacher/data/lessons/demo-python-loops.json"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find and remove the duplicate for-loop scene (lines 75-80)
# The duplicate has leftover props.subtitle content
new_lines = []
skip = 0
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue
    # Check if this line starts the leftover scene
    if '"kn": "ಪ್ರತಿಯೊಂದು ಅಂಶಕ್ಗೂ ಪುನರಾವರ್ತಿಸಿ"' in line:
        # Skip the leftover scene
        skip = 2
        continue
    new_lines.append(line)

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Cleaned up: Removed leftover dummy scene")
