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
    dropArea.style.background = '';

    const files = event.dataTransfer.files;
    if (files.length > 0) {

        if (files[0].type != "application/octet-stream" && files[0].type != "") {
            await handleMultipleFiles(files);
        }
        else {
            alert("This is file or folder not support (please add files or folder with button)!");
        }
    }
});

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

    resultsContainer.innerHTML += `
		<div class="result-header">
			<h4>Result</h4>
			<h5 style="margin-bottom: 20px;">Files count: ${counter}</h5>
		</div>
	`;

    for (let file of files) {
        const ext = path.extname(file.name).toLowerCase();
        if (executableExtensions.includes(ext)) {
            await handleFile(file);
            fileCounter += 1;
        }
    }
});

module.exports = {};