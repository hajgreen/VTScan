const path = require('path');

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const folderInput = document.getElementById('folder-input');
const fileSelectButton = document.getElementById('file-select-button');
const folderSelectButton = document.getElementById('folder-select-button');

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
fileSelectButton.addEventListener('click', () => {
    fileInput.value = null;
    resultsContainer.innerHTML = "";
    fileInput.click();
});

// Event listener برای انتخاب پوشه از طریق دکمه
folderSelectButton.addEventListener('click', () => {
    folderInput.value = null;
    resultsContainer.innerHTML = "";
    folderInput.click();
});

fileInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
        await handleMultipleFiles(files);
    }
});

folderInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    const executableExtensions = [
        '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.msc', '.reg', '.inf', '.jar', '.py', ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".tar.gz", ".tar.bz2", ".tar.xz", ".z", ".lz", ".lzma", ".cab", ".iso", ".tgz", ".tbz2", ".txz", ".wim", ".dmg", ".s7z"
    ];

    fileCounter = 1;

    let counter = 0;
    for (let file of files) {
        const ext = path.extname(file.name).toLowerCase();
        if (executableExtensions.includes(ext)) {
            counter++;
        }
    }

    filesLength = counter;

    for (let file of files) {
        const ext = path.extname(file.name).toLowerCase();
        if (executableExtensions.includes(ext)) {
            await handleFile(file);
            fileCounter += 1;
        }
    }
});

module.exports = {};