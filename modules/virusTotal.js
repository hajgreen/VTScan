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
            fileSection.innerHTML += `<p class="text-danger" id="hash-error">File with hash ${hash} not found in VirusTotal database.</p>`;

            // ایجاد دکمه آپلود
            if (file.size <= 32 * 1024 * 1024 && file) {
                const uploadButton = document.createElement('button');
                uploadButton.id = "uploadBtn-" + fileName;
                uploadButton.classList.add('btn');
                uploadButton.classList.add('btn-primary');
                uploadButton.textContent = 'Upload to VirusTotal';
                uploadButton.onclick = () => { uploadFile(file, fileSection); this.disabled = true; }
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
                fileSection.innerHTML += `<p class="text-danger">File is larger than 32MB cannot be uploaded.</p>`;
                ShowLoading(false);
            }
        }
        else {
            const errorDetails = await response.json();
            fileSection.innerHTML += `<p class="text-danger">Error checking file hash: ${errorDetails.error.message}</p>`;
            ShowLoading(false);
        }
    } catch (error) {
        fileSection.innerHTML += `<p class="text-danger">Network or fetch error: ${error.message}</p>`;
        ShowLoading(false);
    }
}

module.exports = { getApiKey, checkFileHash };