@echo off
:: Schimba directorul de lucru la cel in care se afla fizic acest fisier .bat
:: (Rezolva eroarea System32 care apare atunci cand fisierul este rulat ca Administrator sau prin scurtaturi)
cd /d "%~dp0"

setlocal enabledelayedexpansion
title Sintonizator Premium Global Stream
color 0A

echo =====================================================================
echo                 SINTONIZATOR PREMIUM GLOBAL STREAM
echo =====================================================================
echo.
echo [INFO] Se verifica configuratia sistemului dumneavoastra...
echo.

:: Verifica daca Node.js este instalat
node --version >nul 2>&1
if errorlevel 1 goto NoNode

echo [OK] Node.js a fost detectat cu succes pe sistem.
echo.

:: Verifica daca folderul node_modules exista
if not exist node_modules goto InstallDeps
echo [OK] Dependentele instalate au fost gasite deja.
goto RunApp

:InstallDeps
echo [INFO] Se instaleaza dependentele programului - se executa 'npm install'...
echo Aceasta operatiune dureaza aproximativ 1-2 minute prima data.
echo Va rugam sa asteptati...
echo.
call npm install
if errorlevel 1 goto InstallFailed
echo.
echo [OK] Toate dependentele au fost instalate cu succes!
echo.
goto RunApp

:RunApp
echo ---------------------------------------------------------------------
echo  [SUCCES] Aplicatia porneste acum!
echo  Se deschide sintonizatorul in mod Fereastra Aplicatie Dedicata (fara tab-uri)...
echo.
echo  NOTA: Nu inchideti aceasta fereastra neagra cat timp ascultati muzica!
echo ---------------------------------------------------------------------
echo.

:: Incercam sa deschidem in modul "App Window" (Edge sau Chrome) pentru a arata ca o aplicatie desktop nativa (fara bare si tab-uri de browser)

:: 1. Incercam cu Microsoft Edge App Mode (este prezent implicit pe Windows 10/11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    goto LaunchServer
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    goto LaunchServer
)

:: 2. Incercam cu Google Chrome App Mode
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    goto LaunchServer
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    goto LaunchServer
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    goto LaunchServer
)

:: 3. Daca nu se gaseste niciunul, deschidem in browserul implicit al sistemului
start http://localhost:3000

:LaunchServer
:: Lanseaza serverul local de dezvoltare
call npm run dev
if errorlevel 1 goto RunFailed
goto End

:NoNode
echo [EROARE] Node.js nu este instalat pe acest calculator!
echo.
echo Pentru a rula acest program de radio, trebuie sa aveti instalat Node.js.
echo Va rugam sa descarcati si sa instalati versiunea recomandata LTS de la:
echo https://nodejs.org/
echo.
echo Dupa ce finalizati instalarea Node.js, redeschideti acest fisier!
echo.
pause
exit

:InstallFailed
echo.
echo [EROARE] Instalarea dependentelor - npm install - a esuat!
echo Va rugam sa verificati conexiunea la internet si sa incercati din nou.
echo.
pause
exit

:RunFailed
echo.
echo [EROARE] Pornirea serverului de radio a esuat!
echo Verificati daca portul 3000 nu este utilizat deja de o alta aplicatie.
echo.
pause
exit

:End
pause
