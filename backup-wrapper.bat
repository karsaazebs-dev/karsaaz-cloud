@echo off
REM Wrapper for Windows Task Scheduler. Runs the bash backup script via Git Bash.

setlocal
set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"
set "SCRIPT_DIR=C:\Dev\Karsaaz Cloud\karsaaz-cloud-main\karsaaz-cloud-main"

if not exist "%BASH_EXE%" (
    echo [ERROR] Git Bash not found at %BASH_EXE% >> "%SCRIPT_DIR%\backups\backup.log"
    exit /b 1
)

"%BASH_EXE%" -lc "cd '/c/Dev/Karsaaz Cloud/karsaaz-cloud-main/karsaaz-cloud-main' && bash backup.sh"
exit /b %errorlevel%
