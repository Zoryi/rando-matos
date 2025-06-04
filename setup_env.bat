@echo off
REM This script checks for a basic Flutter and Android development environment on Windows.

echo Checking Flutter and Android environment...
echo.

REM --- Check for Flutter ---
echo Checking for Flutter installation...
flutter --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Flutter command not found.
    echo Please ensure Flutter is installed and added to your PATH.
    echo Download Flutter from: https://flutter.dev/docs/get-started/install/windows
    echo.
    goto :eof
) ELSE (
    echo Flutter installation found.
    flutter --version
    echo.
)

REM --- Check for Android SDK / Android Studio indicators ---
echo Checking for Android SDK / Android Studio...
SET "ANDROID_SDK_PATH_LOCAL=%LOCALAPPDATA%\Android\Sdk"
SET "ANDROID_STUDIO_JRE_PROGRAMFILES=%PROGRAMFILES%\Android\Android Studio\jre"
SET "ANDROID_STUDIO_JRE_PROGRAMFILES_X86=%PROGRAMFILES(X86)%\Android\Android Studio\jre"

IF EXIST "%ANDROID_SDK_PATH_LOCAL%" (
    echo Found Android SDK at: %ANDROID_SDK_PATH_LOCAL%
) ELSE IF EXIST "%ANDROID_STUDIO_JRE_PROGRAMFILES%" (
    echo Found Android Studio JRE, likely Android Studio is installed. SDK might be at default location or custom.
    echo Default SDK location with Android Studio: %LOCALAPPDATA%\Android\Sdk
) ELSE IF EXIST "%ANDROID_STUDIO_JRE_PROGRAMFILES_X86%" (
    echo Found Android Studio (x86) JRE, likely Android Studio is installed. SDK might be at default location or custom.
    echo Default SDK location with Android Studio: %LOCALAPPDATA%\Android\Sdk
) ELSE (
    echo Could not find common Android SDK location (%LOCALAPPDATA%\Android\Sdk)
    echo or Android Studio JRE installation indicators.
    echo Please ensure Android Studio is installed and the Android SDK is set up correctly.
    echo Download Android Studio from: https://developer.android.com/studio
    echo.
    REM Not exiting here, as flutter doctor will give more specific advice.
)
echo.

REM --- Run Flutter Doctor ---
echo Running flutter doctor to diagnose your environment...
echo This may take a few minutes.
echo.
flutter doctor
echo.
echo Flutter doctor check completed.
echo Please review the output above and follow any advice provided to resolve issues.
echo.

:eof
echo Script finished.
