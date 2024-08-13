const { ipcRenderer } = require('electron');

//Get Api Key
var apiCounter = -1;

async function getApiKey() {
    const api = await ipcRenderer.invoke('get-api-key');

    if (api.length != apiCounter + 1) {
        apiCounter += 1;
    }
    else {
        apiCounter = 0;
    }

    return api[apiCounter];
}

async function checkFileHash(hash, fileName, fileSection, file = undefined) {

    ShowLoading(true);

    const apiKey = await getApiKey();;
    const url = "https://www.virustotal.com/api/v3/files/" + hash;

    try {

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-apikey': apiKey
            }
        });

        if (response.ok) {
            const result = await response.json();
            displayResults(result.data.attributes, fileName, fileSection, file);
        }
        else if (response.status === 404) {
            fileSection.innerHTML += `<p>File Name: <strong>${fileName}</strong></p>`;
            fileSection.innerHTML += `<p style="color: red;" id="hash-error">File with hash ${hash} not found in VirusTotal database.</p>`;

            // ایجاد دکمه آپلود
            if (file.size <= 32 * 1024 * 1024 && file) {
                const uploadButton = document.createElement('button');
                uploadButton.id = "uploadBtn-" + fileName;
                uploadButton.classList.add('btn');
                uploadButton.classList.add('btn-primary');
                uploadButton.textContent = 'Upload to VirusTotal';
                uploadButton.onclick = () => { uploadFile(file, apiKey, fileSection); this.disabled = true; }
                fileSection.appendChild(uploadButton);

                // ساختن نوار پیشرفت
                const uploadProgress = document.createElement('div');
                uploadProgress.id = 'uploadProgress-' + fileName;
                uploadProgress.style.display = 'none';
                uploadProgress.classList.add("upload-progress");
                uploadProgress.innerHTML = `
											<span id="progressPercentage-${fileName}">0%</span>
											<progress id="progressBar-${fileName}" value="0" max="100"></progress>
											<span id="messageProgessBar-${fileName}"></span>
										`;
                fileSection.appendChild(uploadProgress);

                ShowLoading(false);
            }
            else {
                fileSection.innerHTML += `<p>File is larger than 32MB and cannot be uploaded.</p>`;
            }
        }
        else {
            const errorDetails = await response.json();
            fileSection.innerHTML += `<p>Error checking file hash: ${errorDetails.error.message}</p>`;
        }
    } catch (error) {
        fileSection.innerHTML += `<p>Network or fetch error: ${error.message}</p>`;
    }
}

module.exports = { getApiKey, checkFileHash };