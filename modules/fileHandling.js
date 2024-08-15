const resultsContainer = document.getElementById('results');
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

// Listen for the 'handle-file' event from the main process
ipcRenderer.on('handle-file', async (event, file) => {
    handleFileContextMenu(await file);
});
// Listen for the 'handle-folder' event from the main process
ipcRenderer.on('handle-folder', async (event, folderPath) => {
    handleFolderContextMenu(await folderPath);
});

var nowTime = performance.now();

// Function برای پردازش فایل‌های انتخابی
async function handleMultipleFiles(files) {
    ShowLoading(true);

    fileCounter = 0;
    filesLength = files.length;

    resultsContainer.innerHTML += `
		<div class="result-header">
			<h4>Result</h4>
			<h5 style="margin-bottom: 20px;">Files count: ${files.length}</h5>
		</div>
	`;

    for (let file of files) {
        fileCounter += 1;
        await handleFile(file);
    }

    ShowLoading(false);
}


async function handleFolderContextMenu(folderPath) {

    if ((performance.now() - nowTime) > 750) {
        resultsContainer.innerHTML = "";
        nowTime = performance.now();
    }
    else {
        nowTime = performance.now();
    }

    if (!fs.existsSync(folderPath)) {
        console.error("Folder does not exist.");
        return;
    }

    const stats = fs.statSync(folderPath);

    if (!stats.isDirectory()) {
        console.error("The path is not a directory.");
        return;
    }

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isFile()) {
            // خواندن محتوای فایل به عنوان یک Buffer
            const fileData = fs.readFileSync(filePath);

            // ایجاد یک Blob از داده‌های فایل
            const blob = new Blob([fileData]);

            // ایجاد یک شیء File معتبر از Web API
            const fileObject = new File([blob], path.basename(filePath), {
                type: '', // MIME type می‌تواند اضافه شود اگر نیاز بود
                lastModified: fileStats.mtimeMs,
            });

            // فراخوانی تابع handleFile برای پردازش فایل
            await handleFile(fileObject);
        } else if (fileStats.isDirectory()) {
            // handleFolderContextMenu(filePath);
        }
    }
}


async function handleFileContextMenu({ fileName, fileSize, fileData }) {


    if ((performance.now() - nowTime) > 750) {
        resultsContainer.innerHTML = "";
        nowTime = performance.now();
    }
    else {
        nowTime = performance.now();
    }

    ShowLoading(true);

    const maxFileSize = 650 * 1024 * 1024;

    if (fileSize > maxFileSize) {
        alert('File size exceeds the 650 MB limit.');
        document.getElementById('results').innerHTML = "";
        return;
    }

    const fileSection = document.createElement('div');
    fileSection.className = 'file-section';
    resultsContainer.appendChild(fileSection);

    const blob = new Blob([fileData]);

    const reader = new FileReader();
    reader.onload = function () {
        const fileBuffer = new Uint8Array(reader.result);

        const worker = new Worker('./modules/worker.js');
        worker.postMessage({ fileData: fileBuffer.buffer });

        worker.onmessage = async function (event) {
            const hash = event.data;
            fileSection.innerHTML += `<p>File Hash (SHA-256): ${hash}</p>`;
            await checkFileHash(hash, fileName, fileSection, { size: fileSize });
        };

        worker.onerror = function (error) {
            console.error('Worker error:', error);
        };
    };
    reader.readAsArrayBuffer(blob);
}

// 

async function handleFile(file) {

    ShowLoading(true);

    const maxFileSize = 650 * 1024 * 1024;

    if (file.size > maxFileSize) {
        alert('File size exceeds the 650 MB limit.');
        resultsContainer.innerHTML = "";
        return;
    }

    const fileName = file.name;

    const reader = new FileReader();
    reader.onload = function () {
        const fileData = new Uint8Array(reader.result);

        const worker = new Worker('./modules/worker.js');
        worker.postMessage({ fileData: fileData.buffer });

        worker.onmessage = async function (event) {
            const hash = event.data;

            const fileSection = document.createElement('div');
            fileSection.className = 'file-section';
            resultsContainer.appendChild(fileSection);
            fileSection.innerHTML += `<p>File Hash (SHA-256): ${hash}</p>`;

            await checkFileHash(hash, fileName, fileSection, file);
        };

        worker.onerror = function (error) {
            console.error('Worker error:', error);
        };
    };
    reader.readAsArrayBuffer(file);
}

module.exports = { handleFile, handleMultipleFiles };
