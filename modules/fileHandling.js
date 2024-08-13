const resultsContainer = document.getElementById('results');

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

// Function برای پردازش فایل انتخابی
async function handleFile(file) {

    const maxFileSize = 650 * 1024 * 1024;

    if (file.size > maxFileSize) {
        alert('File size exceeds the 650 MB limit.');
        resultsContainer.innerHTML = "";
        return;
    }

    // نمایش نام فایل
    const fileName = file.name;
    const fileSection = document.createElement('div');
    fileSection.className = 'file-section';
    resultsContainer.appendChild(fileSection);

    // Read file as buffer
    const buffer = await file.arrayBuffer();
    const fileData = new Uint8Array(buffer);

    // محاسبه هش فایل
    const hash = calculateHash(fileData);

    // نمایش هش فایل
    fileSection.innerHTML += `<p>File Hash (SHA-1): ${hash}</p>`;

    // بررسی هش در VirusTotal
    await checkFileHash(hash, fileName, fileSection, file);
}

function calculateHash(fileData) {
    const crypto = require('crypto');
    return crypto.createHash('sha1').update(fileData).digest('hex');
}

module.exports = { handleFile, handleMultipleFiles };
