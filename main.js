const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

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
		const template = [
			{
				label: 'Scan Files',
				click: () => { event.sender.send('context-menu-command', 'scan-file'); }
			},
			{
				label: 'Scan Folder',
				click: () => { event.sender.send('context-menu-command', 'scan-folder'); }
			},
			{
				label: "Dev Tools",
				role: 'toggleDevTools'
			}
		];
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
	return process.env.VIRUSTOTAL_API_KEY;
});