@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto use_python
py -3 server\setup_connection.py
goto done
:use_python
where python >nul 2>nul
if errorlevel 1 goto missing
python server\setup_connection.py
goto done
:missing
echo Python 3 is required. Install Python 3 from https://www.python.org/downloads/windows/
:done
pause
