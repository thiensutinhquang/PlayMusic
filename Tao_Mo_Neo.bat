@echo off
title Tao Mo Neo Tinh Lang V2 (Tu dong tai Core)
echo ====================================================================
echo B0 CONG CU TAO MO NEO TINH LANG (AUTO-FIX FFMPEG)
echo ====================================================================
echo.

:: Kiem tra FFmpeg co san trong may khong
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Da tim thay FFmpeg goc cua he thong.
    set "FFMPEG_CMD=ffmpeg"
    goto :GENERATE
)

:: Kiem tra FFmpeg portable co san o thu muc hien tai khong
if exist "ffmpeg.exe" (
    echo [OK] Da tim thay ffmpeg.exe cam tay.
    set "FFMPEG_CMD=ffmpeg.exe"
    goto :GENERATE
)

echo [!] HE THONG BAO LOI: Chua cai dat FFmpeg.
echo [*] Tram Sentinel dang tai file loi FFmpeg sieu nhe (15MB) ve may...
echo.
powershell -Command "$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/eugeneware/ffmpeg-static/releases/download/b4.4/win32-x64' -OutFile 'ffmpeg.exe'"

if not exist "ffmpeg.exe" (
    echo [X] LOI: Mang bi chan hoac khong the tai FFmpeg.
    pause
    exit /b
)

echo [OK] Tai thanh cong loi FFmpeg.
set "FFMPEG_CMD=ffmpeg.exe"

:GENERATE
echo ====================================================================
echo [~] Dang tien hanh "duc" m0 neo: silence_30min.mp3 ...
%FFMPEG_CMD% -y -f lavfi -i anullsrc=r=44100:cl=mono -t 1800 -q:a 9 silence_30min.mp3 -loglevel error

if exist "silence_30min.mp3" (
    echo.
    echo [V] THANH CONG! Da tao xong file "silence_30min.mp3".
    echo [*] Action Item: Copy file nay va day len thu muc root cua Github Pages.
) else (
    echo.
    echo [X] THAT BAI. Co loi xay ra trong qua trinh tao file.
)
echo ====================================================================
pause