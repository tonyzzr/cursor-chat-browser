@echo off
start http://localhost:3000
timeout /t 3
cd /d "E:\NoSync\Cursor\cursor-chat-browser"
npm run dev
