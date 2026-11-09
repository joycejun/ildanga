@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  python server\prewarm_reviews.py
) else (
  py -3 server\prewarm_reviews.py
)
pause
