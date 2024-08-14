const resultsContainer = document.getElementById('results');
const { ipcRenderer } = require('electron');

// Listen for the 'handle-file' event from the main process
ipcRenderer.on('handle-file', (event, file) => {
    handleFileContextMenu(file);
});

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

async function handleFileContextMenu({ fileName, fileSize, fileData }) {
    const maxFileSize = 650 * 1024 * 1024;

    if (fileSize > maxFileSize) {
        alert('File size exceeds the 650 MB limit.');
        document.getElementById('results').innerHTML = "";
        return;
    }

    ShowLoading(true);

    const fileSection = document.createElement('div');
    fileSection.className = 'file-section';
    document.getElementById('results').appendChild(fileSection);

    const blob = new Blob([fileData]);

    const reader = new FileReader();
    reader.onload = function () {
        const fileBuffer = new Uint8Array(reader.result);

        const worker = new Worker('./modules/worker.js');
        worker.postMessage({ fileData: fileBuffer.buffer });

        worker.onmessage = async function (event) {
            const hash = event.data;
            fileSection.innerHTML += `<p>File Hash (SHA-1): ${hash}</p>`;
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
    const maxFileSize = 650 * 1024 * 1024;

    if (file.size > maxFileSize) {
        alert('File size exceeds the 650 MB limit.');
        resultsContainer.innerHTML = "";
        return;
    }

    ShowLoading(true);

    const fileName = file.name;
    const fileSection = document.createElement('div');
    fileSection.className = 'file-section';
    document.getElementById('results').appendChild(fileSection);

    const reader = new FileReader();
    reader.onload = function () {
        const fileData = new Uint8Array(reader.result);

        const worker = new Worker('./modules/worker.js');
        worker.postMessage({ fileData: fileData.buffer });

        worker.onmessage = async function (event) {
            const hash = event.data;
            fileSection.innerHTML += `<p>File Hash (SHA-1): ${hash}</p>`;
            await checkFileHash(hash, fileName, fileSection, file);
        };

        worker.onerror = function (error) {
            console.error('Worker error:', error);
        };
    };
    reader.readAsArrayBuffer(file);
}

module.exports = { handleFile, handleMultipleFiles };
