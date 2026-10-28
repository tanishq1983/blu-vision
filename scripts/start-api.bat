@echo off
cd /d C:\Users\tanis\blu-visual-teacher
set PORT=3001
set VITE_ORIGIN=http://127.0.0.1:5173
node node_modules/tsx/dist/cli.mjs server/index.ts >> api.log 2>&1