async function rescanFile(fileId, event) {
    const apiKey = await getApiKey();

    try {
        const url = `https://www.virustotal.com/api/v3/files/${fileId}/analyse`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-apikey': apiKey
            }
        });

        if (response.ok) {
            alert("The rescan request was successfully completed (new results will be applied in a few minutes)")
        } else {
            alert("The request failed!)")
        }
    } catch (error) {
        alert("The request failed!)")
    }
}

async function pollScanResults(scanId, fileName, fileSection) {
    const apiKey = await getApiKey();
    const url = `https://www.virustotal.com/api/v3/analyses/${scanId}`;

    document.getElementById(`messageProgessBar-${fileName}`).innerHTML = `
		<div class="progress-polling mt-2 gap-2">
			<span>Scanning in progress (this process may take time)</span>
			<div class="spinner-border text-primary" style="height: 28px !important; width: 28px !important; font-size: 16px;" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	`;

    const intervalId = setInterval(async () => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-apikey': apiKey
                }
            });

            if (response.ok) {
                const result = await response.json();

                if (result.data.attributes.status == "completed") {
                    displayStreamingResults(result.data.attributes, fileName, fileSection);
                    clearInterval(intervalId);
                }
            } else {
                fileSection.innerHTML += `<p>Error fetching scan results: ${response.statusText}</p>`;
                clearInterval(intervalId);
            }
        } catch (error) {
            fileSection.innerHTML += `<p>Network or fetch error: ${error.message}</p>`;
            clearInterval(intervalId);
        }
    }, 2000); // چک کردن هر 5 ثانیه
}

async function uploadFile(file, fileSection) {
    const apiKey = await getApiKey();
    const url = "https://www.virustotal.com/api/v3/files";
    const fileName = file.name;

    // نمایش نوار پیشرفت
    const progressBar = document.getElementById('progressBar-' + fileName);
    const progressPercentage = document.getElementById('progressPercentage-' + fileName);
    const uploadProgress = document.getElementById('uploadProgress-' + fileName);
    uploadProgress.style.display = 'flex';

    const uploadBtn = document.getElementById("uploadBtn-" + fileName);
    const hashError = document.getElementById("hash-error");
    uploadBtn.remove();
    hashError.remove();


    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('x-apikey', apiKey);

    // رویداد برای نظارت بر پیشرفت آپلود
    xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            progressBar.value = percentComplete;

            if (percentComplete == 100) {
                const message = document.getElementById(`messageProgessBar-${fileName}`);
                message.innerText = "Upload successful!";
                message.classList.add("message-upload")
            }

            progressPercentage.textContent = percentComplete + '%';
        }
    };

    // رویداد زمانی که آپلود کامل شد
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const scanId = response.data.id;
            pollScanResults(scanId, file.name, fileSection);
        }
        else {
            fileSection.innerHTML += `<p>Error uploading file: ${xhr.statusText}</p>`;
        }
    };

    // ارسال درخواست
    xhr.send(formData);
}

module.exports = { uploadFile, rescanFile };