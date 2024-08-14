const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme } = require('electron');
const { api_keys } = require('./data/vt_api_keys.json');
const { version } = require('./package.json');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

require('dotenv').config();

var win;

function createWindow() {
	win = new BrowserWindow({
		width: 1024,
		height: 768,
		minWidth: 650,
		minHeight: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: false,
		}
	});

	win.loadFile('index.html');

	// After the window has loaded, send the file path to the renderer process
	win.webContents.on('did-finish-load', () => {
		if (process.argv.length >= 1) {
			const filePath = process.argv[1].replace("--file=", "");
			sendFileToRenderer(win, filePath);
		}
	});
}

function sendFileToRenderer(mainWindow, filePath) {

	if (fs.existsSync(filePath)) {
		const stats = fs.statSync(filePath);

		if (stats.isFile()) {
			const fileName = path.basename(filePath);
			const fileSize = stats.size;
			const fileData = fs.readFileSync(filePath);

			mainWindow.webContents.send('handle-file', { fileName, fileSize, fileData });
		} else if (stats.isDirectory()) {
			console.log("The path is a directory, not a file.");
			// Handle the case where the path is a directory, if needed
		}
	} else {
		console.error("File or directory does not exist.");
	}
}

async function getTheme() {

	const store = new Store();
	const theme = store.get('theme');

	if (theme) {
		if (theme == 'dark') {
			nativeTheme.themeSource = 'dark';
		}
		else if (theme == 'light') {
			nativeTheme.themeSource = 'light';
		}
	}
	else {
		await store.set('theme', 'dark');
		nativeTheme.themeSource = 'dark';
	}
} getTheme();

app.whenReady().then(() => {

	const gotTheLock = app.requestSingleInstanceLock();

	if (!gotTheLock) {
		app.quit();
		return;
	}

	app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
		if (win) {
			if (win.isMinimized()) win.restore();
			win.focus();
		}

		const fileArgIndex = commandLine.findIndex(arg => arg.startsWith('--file='));
		const folderArgIndex = commandLine.findIndex(arg => arg.startsWith('--folder='));

		if (fileArgIndex !== -1) {
			if (process.argv.length > 1) {
				const filePath = commandLine[1].replace("--file=", "");
				sendFileToRenderer(win, filePath);
			}
		}
		else if (folderArgIndex !== -1) {
			if (process.argv.length > 1) {
				const folderPath = commandLine[1].replace("--folder=", "");
				win.webContents.send('handle-folder', folderPath);
			}
		}
	});

	createWindow();

	app.on('activate', () => {
		if (win === null) {
			createWindow();
		}
	});

	Menu.setApplicationMenu(null);

	// Context Menu
	ipcMain.on('show-context-menu', (event) => {
		var template = [
			{
				label: 'Scan Files',
				click: () => { event.sender.send('context-menu-command', 'scan-file'); }
			},
			{
				label: 'Scan Folder',
				click: () => { event.sender.send('context-menu-command', 'scan-folder'); }
			},
			{
				role: 'reload'
			},
			{
				label: 'View',
				submenu: [
					{ role: 'forceReload' },
					{ role: 'toggleDevTools' },
					{ type: 'separator' },
					{ role: 'resetZoom' },
					{ role: 'zoomIn' },
					{ role: 'zoomOut' },
					{ type: 'separator' },
					{ role: 'togglefullscreen' }
				]
			},
			{
				label: 'About',
				click: () => {
					dialog.showMessageBox({
						type: 'info',
						title: 'About',
						message: `VTScan free VirusTotal scanner multi platform. \n\nDeveloper: Mohammad Rasabakhsh\n\nhttps://github.com/madrasa7/VTScan/\n\nVersion: ${version}`,
						buttons: ['OK']
					});
				}
			},
			{
				label: 'Exit',
				role: 'close'
			}
		];

		if (process.env.IS_ADMIN && process.env.IS_ADMIN == "true") {
			template.push(
				{
					label: "Dev Tools",
					role: 'toggleDevTools'
				}
			);
		}

		const menu = Menu.buildFromTemplate(template);
		menu.popup(BrowserWindow.fromWebContents(event.sender));
	});

	app.on('open-file', (event, path) => {
		event.preventDefault();
		if (win) {
			win.webContents.send('file-path', filePath);
		}
	});

	// Listen for file-path event from the context menu
	ipcMain.on('file-path', (event, filePath) => {
		if (fs.existsSync(filePath)) {
			const file = {
				name: path.basename(filePath),
				size: fs.statSync(filePath).size,
				path: filePath
			};
			event.sender.send('handle-file', file);
		}
	});
});


app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

ipcMain.handle('get-api-key', () => {

	if (process.env.VIRUSTOTAL_API_KEY) {
		return [process.env.VIRUSTOTAL_API_KEY];
	}
	else {
		return api_keys;
	}
});
