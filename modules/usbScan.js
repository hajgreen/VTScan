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

// تابع اصلی برای لیست کردن فایل‌ها
async function listFiles(directory) {
    const extensions = [
        '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.msc', '.reg', '.jar', '.py', '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tar.gz', '.tar.bz2', '.tar.xz', '.z', '.lz', '.lzma', '.cab', '.iso', '.tgz', '.tbz2', '.txz', '.wim', '.dmg', '.s7z'
    ];

    try {
        const files = await fs.promises.readdir(directory, { withFileTypes: true });

        await Promise.all(files.map(async (file) => {
            const filePath = path.join(directory, file.name);

            if (file.isDirectory()) {
                await listFiles(filePath); // بازگشت به صورت بازگشتی به پوشه‌های داخل
            } else if (file.isFile()) {
                const fileExtension = path.extname(file.name).toLowerCase();
                if (extensions.includes(fileExtension)) {
                    // ایجاد یک شبیه‌ساز فایل برای استفاده در مرورگر
                    const simulatedFile = await createSimulatedFile(filePath);

                    // فراخوانی تابع handleFile با فایل شبیه‌سازی‌شده
                    await handleFile(simulatedFile);
                }
            }
        }));
    } catch (err) {
        // console.error(`Error reading directory: ${err}`);
    }
}

// تابعی برای شبیه‌سازی فایل در محیط مرورگر
async function createSimulatedFile(filePath) {
    // خواندن داده‌های فایل از مسیر مشخص شده
    const fileData = await fs.promises.readFile(filePath);

    // استخراج نام فایل از مسیر
    const fileName = path.basename(filePath);

    // به دست آوردن اندازه فایل
    const fileSize = fileData.length;

    // ایجاد یک Blob از داده‌های فایل
    const blob = new Blob([fileData], { type: 'application/octet-stream' });

    // ایجاد یک شیء File برای استفاده
    const simulatedFile = new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
    simulatedFile.path = filePath;

    return simulatedFile;
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

function startScanUSB() {
    getUSBMountPath((usbPath) => {
        if (usbPath) {
            listFiles(usbPath);
        } else {
            console.error('Could not detect USB mount path.');
        }
    });
}


module.exports = { createSimulatedFile };