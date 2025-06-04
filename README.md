# app

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Environment Setup (Windows)

This project includes a helper script `setup_env.bat` for Windows users to check their local development environment for Flutter and Android SDK compatibility.

### How to Run the Script

1.  Open a Command Prompt (cmd.exe) or PowerShell.
2.  Navigate to the root directory of this project.
3.  Execute the script by typing `setup_env.bat` and pressing Enter.

### What the Script Does

The `setup_env.bat` script performs the following checks:

*   **Flutter Installation**: Verifies if Flutter is installed and accessible via the system's PATH. If not, it will guide you to the Flutter installation page.
*   **Android SDK/Studio**: Looks for common installation locations of the Android SDK (typically installed with Android Studio). It provides guidance if it cannot find standard indicators of an Android SDK setup.
*   **Flutter Doctor**: Runs `flutter doctor` to provide a detailed report of your Flutter environment status, including connected devices and any missing components or configurations.

### Follow Up

After running the script, please carefully review its output and any messages or warnings from `flutter doctor`. Follow the advice provided to resolve any detected issues and ensure your environment is correctly configured for Flutter development.
