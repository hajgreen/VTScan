const { app, BrowserWindow, Menu, ipcMain, dialog, nativeTheme, screen, Tray } = require('electron');
const { api_keys } = require('./data/vt_api_keys.json');
const { version } = require('./package.json');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const { usb } = require('usb');
const { checkSize } = require('./modules/func');

require('dotenv').config();
const store = new Store();

const hideToTray = store.get('hideToTray');
const addToStartup = store.get('addToStartup');

var win;
let tray;

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

	// Listener for switching to settings
	ipcMain.on('open-settings', (event) => {
		win.loadFile(path.join(__dirname, './pages/settings.html'));
	});

	ipcMain.on('back-to-index', (event) => {
		win.loadFile(path.join(__dirname, 'index.html'));
	});

	win.on('close', function (event) {
		if (hideToTray == undefined || hideToTray == true) {

			if (!app.isQuiting) {
				event.preventDefault();
				win.hide();
			}

			return false;
		}
		else {
			app.isQuiting = true;
			app.quit();
		}
	});


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

					if (checkSize(arrFiles[i])) {
						await win.webContents.send('handle-file', { pathFile: PathToFile(arrFiles[i]), fileCount: arrFiles.length });
					}
					else {
						dialog.showMessageBox({
							type: 'error',
							title: 'File size',
							message: "File size exceeds the 650 MB limit.",
							buttons: ['OK']
						});
					}
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

function createNotificationWindow() {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize; // گرفتن اندازه صفحه نمایش اصلی

	const notificationWindow = new BrowserWindow({
		width: 600,
		height: 300,
		x: (width - 300) / 2, // قرار دادن پنجره در وسط صفحه
		y: (height - 150) / 2, // قرار دادن پنجره در وسط صفحه
		frame: false, // بدون قاب
		alwaysOnTop: true, // همیشه روی دیگر پنجره‌ها
		transparent: true, // شفافیت پنجره
		resizable: false, // غیر قابل تغییر اندازه
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false, // اجازه دسترسی به IPC
		}
	});

	notificationWindow.loadFile('./pages/notification.html');

	// گوش دادن به درخواست بستن پنجره
	ipcMain.on('close-notification', () => {
		notificationWindow.close();
	});

	ipcMain.on('start-usb-scan-main', async () => {
		if (win) {
			if (win.isMinimized()) win.restore();
			win.focus();
		}
		await win.webContents.send('start-usb-scan', { start: true });
	});
}

function PathToFile(filePath) {

	const stats = fs.statSync(filePath);
	const fileName = path.basename(filePath);
	const fileSize = stats.size;
	const fileData = fs.readFileSync(filePath);

	return { fileName, fileSize, fileData, filePath };
}

function getTheme() {
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

	// Hide to Try

	if (hideToTray == undefined || hideToTray == true) {
		tray = new Tray(path.join(__dirname, './build/icon.ico'));

		const contextMenu = Menu.buildFromTemplate([
			{
				label: 'Show App', click: function () {
					win.show();
				}
			},
			{
				label: 'Quit', click: function () {
					app.isQuiting = true;
					app.quit();
				}
			}
		]);

		tray.setToolTip('VTScan');
		tray.setContextMenu(contextMenu);

		tray.on('click', () => {
			win.isVisible() ? win.hide() : win.show();
		});
	}

	// 

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
					if (checkSize(filePath)) {
						arrFiles.push(filePath);
					}
					else {
						dialog.showMessageBox({
							type: 'error',
							title: 'File size',
							message: "File size exceeds the 650 MB limit.",
							buttons: ['OK']
						});
					}

				}
				else {

					if (checkSize(filePath)) {
						await win.webContents.send('handle-file', { pathFile: PathToFile(filePath), fileCount: 0 });
					}
					else {
						dialog.showMessageBox({
							type: 'error',
							title: 'File size',
							message: "File size exceeds the 650 MB limit.",
							buttons: ['OK']
						});
					}
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

ipcMain.handle('select-files', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile', 'multiSelections'] // برای انتخاب چند فایل
	});

	if (canceled) {
		return []; // اگر کاربر لغو کرد، یک آرایه خالی بازگشت داده می‌شود
	} else {
		return filePaths; // مسیرهای کامل فایل‌های انتخاب شده را بازگشت می‌دهد
	}
});

// Listener برای درخواست انتخاب پوشه از طرف Renderer Process
ipcMain.handle('select-folder', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openDirectory'] // برای انتخاب چند پوشه
	});

	if (canceled) {
		return []; // اگر کاربر لغو کرد، یک آرایه خالی بازگشت داده می‌شود
	} else {
		return filePaths; // مسیرهای کامل پوشه‌های انتخاب شده را بازگشت می‌دهد
	}
});

usb.on('attach', () => {
	createNotificationWindow();
});
