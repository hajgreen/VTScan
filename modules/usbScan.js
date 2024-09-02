const { usb } = require('usb');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

// Listen for the 'handle-file' event from the main process
ipcRenderer.on('start-usb-scan', async (event, start) => {

    // ShowLoading(true);
    if (start) {
        startScanUSB();
    }
});

// تابع برای جستجوی فایل‌ها با پسوندهای خاص
function listFiles(directory) {

    const extensions = [
        '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.msc', '.reg', '.jar', '.py', ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".tar.gz", ".tar.bz2", ".tar.xz", ".z", ".lz", ".lzma", ".cab", ".iso", ".tgz", ".tbz2", ".txz", ".wim", ".dmg", ".s7z"
    ];

    fs.readdir(directory, (err, files) => {
        if (err) {
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(directory, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    return;
                }

                if (stats.isFile()) {
                    // بررسی پسوند فایل
                    const fileExtension = path.extname(file).toLowerCase();
                    if (extensions.includes(fileExtension)) {
                        console.log(`File: ${filePath}`);
                    }
                } else if (stats.isDirectory()) {
                    // اگر پوشه باشد، به صورت بازگشتی به آن پوشه بروید
                    listFiles(filePath);
                }
            });
        });
    });
}

// Function to detect USB device mount path (platform-specific)
function getUSBMountPath(callback) {
    const platform = process.platform;

    if (platform === 'win32') {
        // Windows: Use `wmic` to find removable drives
        exec('wmic logicaldisk where "DriveType=2" get DeviceID', (error, stdout) => {
            if (error) {
                console.error(`Error executing command (Windows): ${error.message}`);
                return callback(null);
            }
            const lines = stdout.trim().split('\n').filter(line => line.includes(':'));
            if (lines.length > 0) {
                const usbDrive = lines[0].trim();
                callback(usbDrive);
            } else {
                console.error('No USB drives found (Windows).');
                callback(null);
            }
        });
    } else if (platform === 'linux') {
        // Linux: Use `lsblk` to find mounted USB drives
        exec('lsblk -o NAME,MOUNTPOINT,TYPE | grep "part" | grep "/media/"', (error, stdout) => {
            if (error) {
                console.error(`Error executing command (Linux): ${error.message}`);
                return callback(null);
            }
            console.log('Command output (Linux):', stdout); // Debug output
            const lines = stdout.trim().split('\n');
            const match = lines.find(line => line.includes('/media/'));
            if (match) {
                const mountPath = match.split(' ').pop().trim();
                console.log(`Detected USB drive (Linux): ${mountPath}`); // Debug output
                callback(mountPath);
            } else {
                console.error('No USB drives found (Linux).');
                callback(null);
            }
        });
    } else if (platform === 'darwin') {
        // macOS: Use `diskutil` to find mounted USB drives
        exec('diskutil info -all | grep "Mount Point"', (error, stdout) => {
            if (error) {
                console.error(`Error executing command (macOS): ${error.message}`);
                return callback(null);
            }
            console.log('Command output (macOS):', stdout); // Debug output
            const lines = stdout.trim().split('\n');
            const usbDrive = lines.find(line => line.includes('/Volumes/'));
            if (usbDrive) {
                const mountPath = usbDrive.split(': ')[1].trim();
                console.log(`Detected USB drive (macOS): ${mountPath}`); // Debug output
                callback(mountPath);
            } else {
                console.error('No USB drives found (macOS).');
                callback(null);
            }
        });
    } else {
        console.error(`Unsupported platform: ${platform}`);
        callback(null);
    }
}

// Listen for USB device attachment
// usb.on('attach', (device) => {
//     // Automatically get USB mount path
//     getUSBMountPath((usbPath) => {
//         if (usbPath) {
//             listFiles(usbPath);
//         } else {
//             console.error('Could not detect USB mount path.');
//         }
//     });
// });

function startScanUSB() {
    getUSBMountPath((usbPath) => {
        if (usbPath) {
            listFiles(usbPath);
        } else {
            console.error('Could not detect USB mount path.');
        }
    });
}


module.exports = {};