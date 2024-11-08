const resultsContainer = document.getElementById('results');
const fs = require('fs');
const path = require('path');
const { Snackbar } = require('../data/js/snackbar.js');
const { ipcRenderer } = require('electron');

// Listen for the 'handle-file' event from the main process
ipcRenderer.on('handle-file', async (event, file) => {
    ShowLoading(true);
    const data = await file;
    handleFileContextMenu(data.pathFile, data.fileCount);
});
// Listen for the 'handle-folder' event from the main process
ipcRenderer.on('handle-folder', async (event, folderPath) => {
    ShowLoading(true);
    handleFolderContextMenu(await folderPath);
});

var nowTime = performance.now();

// Function برای پردازش فایل‌های انتخابی
async function handleMultipleFiles(files) {
    for (let file of files) {
        await handleFile(file);
    }
}


async function handleFolderContextMenu(folderPath) {

    if ((performance.now() - nowTime) > 2000) {
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

            if (checkSize(filePath)) {

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

            }

        }
        else if (fileStats.isDirectory()) {
            // handleFolderContextMenu(filePath);
        }

    }

    ShowLoading(false);
}


async function handleFileContextMenu({ fileName, fileSize, fileData, filePath }) {

    if ((performance.now() - nowTime) > 3000) {
        resultsContainer.innerHTML = "";
        nowTime = performance.now();
    }
    else {
        nowTime = performance.now();
    }

    const maxFileSize = 650 * 1024 * 1024;

    if (fileSize > maxFileSize) {

        new Snackbar(`File size exceeds the 650 MB limit.`, {
            position: 'bottom-right',
            actionText: 'Ok',
            style: {
                container: [
                    ['background-color', 'red'],
                    ['border-radius', '5px']
                ],
                message: [
                    ['color', '#eee'],
                ],
                bold: [
                    ['font-weight', 'bold'],
                ],
                actionButton: [
                    ['color', 'white'],
                ],
            }
        });
        document.getElementById('results').innerHTML = "";
        return;
    }

    const fileSection = document.createElement('div');
    fileSection.className = 'file-section';
    resultsContainer.appendChild(fileSection);

    const blob = new Blob([fileData]);

    // Create a new File object
    const file = new File([blob], fileName, { type: "application/octet-stream" });

    const reader = new FileReader();
    reader.onload = function () {
        const fileBuffer = new Uint8Array(reader.result);

        const worker = new Worker('./modules/worker.js');
        worker.postMessage({ fileData: fileBuffer.buffer });

        worker.onmessage = async function (event) {
            const hash = event.data;
            await checkFileHash(hash, fileName, fileSection, file, filePath);
        };

        worker.onerror = function (error) {
            console.error('Worker error:', error);
        };
    };
    reader.readAsArrayBuffer(blob);
}

// 

function getXPath(element) {
    if (element.id !== '') {
        // اگر عنصر دارای شناسه باشد، XPath با استفاده از آن شناسه ساخته می‌شود
        return 'id("' + element.id + '")';
    }
    if (element === document.body) {
        // اگر عنصر بدنه سند باشد
        return element.tagName.toLowerCase();
    }

    let ix = 0;
    const siblings = element.parentNode.childNodes;

    // محاسبه شماره عنصر در بین عناصر هم‌سطح
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) {
            return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
        }
    }
}

function deleteElementByXPath(xpath) {
    const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    );

    const element = result.singleNodeValue; // عنصر پیدا شده را دریافت می‌کند
    if (element) {
        element.parentNode.removeChild(element); // حذف عنصر از DOM
    }
}

var delCount = 0;

async function deleteFile(filePath, event, fileName) {

    const newXPath = getXPath(event).slice(0, 20);

    if (document.getElementsByClassName("snackbar")[0]) {
        document.getElementsByClassName("snackbar")[0].remove();
    }

    new Snackbar(`Delete <b>'${fileName}' ?</b>`, {
        position: 'top-center',
        actionText: 'Yes, Delete',
        timeout: 10000,
        onAction: async () => {

            try {
                // بررسی وجود فایل
                await fs.access(filePath); // این خط بررسی می‌کند که آیا فایل وجود دارد

                // حذف فایل
                await fs.unlink(filePath);


                deleteElementByXPath(newXPath);

                var counterResult = document.getElementById("file-counter-result").innerText[1];
                document.getElementById("file-counter-result").innerText = `(${parseInt(counterResult) - 1})`;

            }
            catch (error) {

                new Snackbar(`Error for delete this file!`, {
                    position: 'top-center',
                    actionText: 'Ok',
                    style: {
                        container: [
                            ['background-color', 'red'],
                            ['border-radius', '5px']
                        ],
                        message: [
                            ['color', '#fff'],
                        ],
                        bold: [
                            ['font-weight', 'bold'],
                        ],
                        actionButton: [
                            ['color', 'white'],
                        ],
                    }
                });
            }

        },
        style: {
            container: [
                ['background-color', '#363636'],
                ['border-radius', '5px'],
                ['box-shadow', '0 0 10px rgba(0, 0, 0, 0.6)'],
                ['width', 'max-context']
            ],
            message: [
                ['color', '#fff'],
            ],
            bold: [
                ['font-weight', '800'],
            ],
            actionButton: [
                ['color', '#fff'],
                ['background-color', 'red'],
                ['border-radius', '5px'],
                ['padding', '8px 12px']
            ],
        }
    });
}

async function handleFile(file) {

    const maxFileSize = 650 * 1024 * 1024;

    if (file.size > maxFileSize) {

        new Snackbar(`File size exceeds the 650 MB limit.`, {
            position: 'bottom-right',
            actionText: 'Ok',
            style: {
                container: [
                    ['background-color', 'red'],
                    ['border-radius', '5px']
                ],
                message: [
                    ['color', '#eee'],
                ],
                bold: [
                    ['font-weight', 'bold'],
                ],
                actionButton: [
                    ['color', 'white'],
                ],
            }
        });

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

            await checkFileHash(hash, fileName, fileSection, file);
        };

        worker.onerror = function (error) {
            console.error('Worker error:', error);
        };
    };
    reader.readAsArrayBuffer(file);
}

module.exports = { handleFile, handleMultipleFiles, deleteFile };
