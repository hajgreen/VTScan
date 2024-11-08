const path = require('path');
const fs = require('fs');

const dropArea = document.getElementById('drop-area');
const fileSelectButton = document.getElementById('file-select-button');
const folderSelectButton = document.getElementById('folder-select-button');
const { ipcRenderer } = require('electron');

// Event listener برای درگ و دراپ فایل
dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.style.background = '#f0f0f0';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.background = '';
});

dropArea.addEventListener('drop', async (event) => {
    resultsContainer.innerHTML = "";
    event.preventDefault();
    dropArea.style.background = ''; // بازگشت به رنگ اولیه

    const items = event.dataTransfer.items;

    for (let i = 0; i < items.length; i++) {
        let item = items[i];

        if (item.webkitGetAsEntry) {
            let entry = item.webkitGetAsEntry();
            if (entry.isDirectory) {
                // اگر آیتم پوشه است، فایل‌های درون آن را پردازش می‌کنیم
                await processDirectory(entry);
            } else {
                // اگر آیتم فایل است، به صورت معمولی پردازش می‌کنیم
                let file = item.getAsFile();
                if (file) {
                    await handleFile(file);
                }
            }
        } else {
            // مرورگرهایی که از webkitGetAsEntry پشتیبانی نمی‌کنند
            let file = item.getAsFile();
            if (file) {
                await handleFile(file);
            }
        }
    }
});

// تابع برای پردازش پوشه
async function processDirectory(directoryEntry) {

    resultsContainer.innerHTML = "";

    const reader = directoryEntry.createReader();
    const entries = await new Promise((resolve, reject) => {
        reader.readEntries((entries) => resolve(entries), (err) => reject(err));
    });

    for (let entry of entries) {
        if (entry.isFile) {
            // اگر آیتم فایل است
            const file = await new Promise((resolve, reject) => {
                entry.file((file) => resolve(file), (err) => reject(err));
            });
            await handleFile(file);
        } else if (entry.isDirectory) {
            // اگر آیتم پوشه است، به صورت بازگشتی پردازش می‌کنیم
            await processDirectory(entry);
        }
    }
}


// Event listener برای انتخاب فایل از طریق دکمه
fileSelectButton.addEventListener('click', async () => {
    resultsContainer.innerHTML = "";
    document.getElementById("file-counter-result").innerText = `(0)`;
    document.getElementById("searchInput").disabled = true;
    document.getElementById("sortOptions").disabled = true;

    const filePaths = await ipcRenderer.invoke('select-files');

    filePaths.map(async (item) => {

        if (checkSize(item)) {
            const file = await createSimulatedFile(item);
            handleFile(file);
        }

    })
});

// Event listener برای انتخاب پوشه از طریق دکمه
folderSelectButton.addEventListener('click', async () => {
    resultsContainer.innerHTML = "";
    document.getElementById("file-counter-result").innerText = `(0)`;
    document.getElementById("searchInput").disabled = true;
    document.getElementById("sortOptions").disabled = true;

    const folderPaths = await ipcRenderer.invoke('select-folder');

    const extensions = [
        '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.msc', '.reg', '.jar', '.py', '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tar.gz', '.tar.bz2', '.tar.xz', '.z', '.lz', '.lzma', '.cab', '.iso', '.tgz', '.tbz2', '.txz', '.wim', '.dmg', '.s7z'
    ];

    try {
        const files = await fs.promises.readdir(folderPaths[0], { withFileTypes: true });

        await Promise.all(files.map(async (file) => {
            const filePath = path.join(folderPaths[0], file.name);

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
});

module.exports = {};