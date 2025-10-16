@echo off
cd /d "c:\electricity-app\electricity-tokens"
echo Running installer with Administrator privileges...
node scripts/comprehensive-installer.js
pause