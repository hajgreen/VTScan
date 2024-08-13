const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const { api_keys } = require('./data/vt_api_keys.json');
const { version } = require('./package.json');
const storage = require('node-persist');
storage.initSync();

require('dotenv').config();

function createWindow() {
	const win = new BrowserWindow({
		width: 1024,
		height: 768,
		minWidth: 650,
		minHeight: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	win.loadFile('index.html');
}

async function getTheme() {
	const theme = await storage.getItem('theme');

	if (theme) {
		if (theme == 'dark') {
			nativeTheme.themeSource = 'dark';
		}
		else if (theme == 'light') {
			nativeTheme.themeSource = 'light';
		}
	}
	else {
		await storage.setItem('theme', 'dark');
		nativeTheme.themeSource = 'dark';
	}
} getTheme();

app.whenReady().then(() => {

	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
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