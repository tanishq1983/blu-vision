@echo off
cd /d C:\Users\tanis\blu-visual-teacher
.venv\Scripts\python.exe python\download_models.py --lang en --root data\models >> download-en.log 2>&1