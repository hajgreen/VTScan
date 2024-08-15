const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme } = require('electron');
const { api_keys } = require('./data/vt_api_keys.json');
const { version } = require('./package.json');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

require('dotenv').config();

var win;
var arrEnable = true;
var arrFiles = [];
var arrFolders = [];

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
	win.webContents.on('did-finish-load', async () => {

		if (process.argv.length >= 2) {

			const fileArgIndex = process.argv[1].slice(0, 7);
			const folderArgIndex = process.argv[1].slice(0, 9);

			if (fileArgIndex == "--file=") {
				const filePath = process.argv[1].slice(7);
				arrFiles.push(filePath);
			}
			else if (folderArgIndex == "--folder=") {
				const folderPath = process.argv[1].slice(9);
				arrFolders.push(folderPath);
			}

			if (arrFiles.length > 0) {
				for (let i = 0; i < arrFiles.length; i++) {
					await win.webContents.send('handle-file', { pathFile: PathToFile(arrFiles[i]), fileCount: arrFiles.length });
				}
			}

			if (arrFolders.length > 0) {
				for (let i = 0; i < arrFolders.length; i++) {
					await win.webContents.send('handle-folder', arrFolders[i]);
				}
			}
		}

		process.argv = [];
		arrEnable = false;
	});
}

function PathToFile(filePath) {

	const stats = fs.statSync(filePath);
	const fileName = path.basename(filePath);
	const fileSize = stats.size;
	const fileData = fs.readFileSync(filePath);

	return { fileName, fileSize, fileData };
}

function getTheme() {

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
		store.set('theme', 'dark');
		nativeTheme.themeSource = 'dark';
	}
} getTheme();

app.whenReady().then(() => {

	const gotTheLock = app.requestSingleInstanceLock();

	if (!gotTheLock) {
		app.quit();
		return;
	}

	app.on('second-instance', async (event, commandLine) => {
		if (win) {
			if (win.isMinimized()) win.restore();
			win.focus();
		}

		if (commandLine.length >= 2) {

			const fileArgIndex = commandLine[1].slice(0, 7);
			const folderArgIndex = commandLine[1].slice(0, 9);

			if (fileArgIndex == "--file=") {
				const filePath = commandLine[1].slice(7);

				if (arrEnable) {
					arrFiles.push(filePath);
				}
				else {
					await win.webContents.send('handle-file', { pathFile: PathToFile(filePath), fileCount: 0 });
				}
			}
			else if (folderArgIndex == "--folder=") {
				const folderPath = commandLine[1].slice(9);

				if (arrEnable) {
					arrFolders.push(folderPath);
				}
				else {
					await win.webContents.send('handle-folder', folderPath);
				}
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
