# VTScan

VTScan (Virus Total Scan) is an Electron-based application that allows users to scan files and folders using the VirusTotal API. This application provides a simple and intuitive interface for users to easily check their files for potential threats.

## Features
- **Speeedup and Lightweight**: The main focus of VTScan is on speed and optimization. The speed of this software is faster than the virustotal site.
- **Beautiful and modern design**: Simple and beautiful design and user interface that is implemented in the best way with the help of bootstrap.
- **Drag and Drop Interface**: Easily drag and drop files or select files and folders for scanning.
- **Folder Scan**: Select the folder and scan all files with executable extension.
- **Real-Time Scanning**: Scan files using the VirusTotal API and get instant results.
- **Cross-Platform**: Works on Windows, macOS, and Linux.

## Requirements

- Node.js (v16.x or higher)
- npm or yarn
- Electron (v12.x or higher)

### Key Sections Explanation

1. **Project Title and Description**: Provides an overview of what the application does.
2. **Features**: Lists the main functionalities of the application.
3. **Requirements**: Specifies the software dependencies needed to run the project.
4. **Installation**: A step-by-step guide to set up the project locally.
5. **Usage**: Instructions on how to start and use the application.
6. **Application Menu**: Describes the different menu options available in the app.
7. **Context Menu**: Information on how to use the context menu.
8. **Development**: Guidelines for developers who want to contribute to the project.
9. **License**: Information about the licensing of the project.
10. **Acknowledgements**: Credits the tools and services used in the project.

## Intsall execute installer

1. download installer from last releases project

2. install program
 

## Install Source Code

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/madrasa7/VTScan.git
   cd VTScan
Install Dependencies:

2. **Insatll dependencies**:

Run the following command to install all the necessary dependencies:

```bash
npm install
```

3. **Configure the API Key**:

* Create a .env file in the root directory and add your VirusTotal API key:


* Copy code to .env file
   ```bash
   VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
   ```
Usage
Start the Application:

To start the Electron application, run:

bash
Copy code
   ```bash
   npm start
   ```
## Scan Files:

Drag and drop files into the application window or use the "Select File" or "Select Folder" buttons.
The application will scan the files and display the results.
Application Menu
The application menu provides the following options:

File: Allows you to quit the application.
Edit: Standard edit options (Undo, Redo, Cut, Copy, Paste).
View: Options to reload, toggle developer tools, and adjust zoom.
Window: Window management options.
Help: A link to learn more about Electron.
Context Menu
Right-click anywhere in the application to open a context menu that provides quick access to file and folder scanning options.

License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgements
Electron for providing the framework.
VirusTotal for the scanning API.
