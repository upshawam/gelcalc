@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
echo Starting gelcalc server...
echo.
echo Opening calculator in your browser at http://localhost:8000
echo.
timeout /t 2 /nobreak
start http://localhost:8000/index.html
call .venv\Scripts\activate.bat
python -m http.server 8000
pause
