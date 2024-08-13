const dropArea = document.getElementById('drop-area');
const resultsContainer = document.getElementById('results');
const fileInput = document.getElementById('file-input');
const folderInput = document.getElementById('folder-input');
const fileSelectButton = document.getElementById('file-select-button');
const folderSelectButton = document.getElementById('folder-select-button');
const loadingStep = document.getElementById('loading-step');
const { dark_mode } = require("./config_vtscan.json");

const crypto = require('crypto');
const path = require('path');
const { ipcRenderer } = require('electron');

var filesLength = 0;
var fileCounter = 1;

//dark mode

if (dark_mode == "true") {
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = 'style_dark.css';
	document.head.appendChild(link);

	document.getElementById("light-mode-icon").style.display = "block";
	document.getElementById("dark-mode-icon").style.display = "none";
	document.getElementById("dark-mode-text").innerText = "Light mode";
}

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

//MenuBar and Context Menu
window.addEventListener('contextmenu', (e) => {
	e.preventDefault();
	ipcRenderer.send('show-context-menu');
});

ipcRenderer.on('context-menu-command', (event, command) => {
	switch (command) {
		case 'scan-file':
			document.getElementById('file-input').click();
			break;
		case 'scan-folder':
			document.getElementById('folder-input').click();
			break;
	}
});


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
	const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.gadget', '.msc', '.pif', '.reg', '.inf', '.jar', '.py'];

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
	return crypto.createHash('sha1').update(fileData).digest('hex');
}

function ShowLoading(bool) {

	if (bool) {
		document.body.style.overflowY = "hidden";
		document.getElementById('loading').style.opacity = '0.9';
		document.getElementById('loading').style.height = '100vh';
	}
	else {
		document.body.style.overflowY = "auto";
		document.getElementById('loading').style.opacity = '0';
		document.getElementById('loading').style.height = '0';
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

function timeAgo(timestamp) {
	// Convert seconds to milliseconds
	const timeInMs = timestamp * 1000;
	const now = new Date();
	const secondsPast = Math.floor((now.getTime() - timeInMs) / 1000);

	if (secondsPast < 60) {
		return `${secondsPast} seconds ago`;
	}
	if (secondsPast < 3600) {
		const minutesPast = Math.floor(secondsPast / 60);
		return `${minutesPast} minutes ago`;
	}
	if (secondsPast < 86400) {
		const hoursPast = Math.floor(secondsPast / 3600);
		return `${hoursPast} hours ago`;
	}
	if (secondsPast < 2592000) {
		const daysPast = Math.floor(secondsPast / 86400);
		return `${daysPast} days ago`;
	}
	if (secondsPast < 31536000) {
		const monthsPast = Math.floor(secondsPast / 2592000);
		return `${monthsPast} months ago`;
	}
	const yearsPast = Math.floor(secondsPast / 31536000);
	return `${yearsPast} years ago`;
}

function displayResults(attributes, fileName, fileSection, file = undefined) {

	const { last_analysis_stats, last_analysis_results } = attributes;
	const totalAVs = last_analysis_stats.harmless + last_analysis_stats.malicious + last_analysis_stats.suspicious + last_analysis_stats.undetected + last_analysis_stats.timeout;
	const maliciousAVs = last_analysis_stats.malicious;

	loadingStep.innerHTML = `${fileCounter} of ${filesLength}`;

	const mainInfo = document.createElement('div');
	mainInfo.classList.add("main-info");

	fileSection.appendChild(mainInfo);

	// نمایش اطلاعات کلی
	mainInfo.innerHTML += `
        <p>Scan result:<span style="color:${maliciousAVs > 2 ? "red" : "#00a500"}; font-weight: 700; margin-left: 4px;">${maliciousAVs} of ${totalAVs}</span> <strong> antivirus malicious detected</strong></p>
    `;
	mainInfo.innerHTML += `<p>File Name: <strong>${fileName}</strong></p>`;
	mainInfo.innerHTML += `<p>File Size: <strong>${(file.size / 1024 / 1024).toFixed(2)} MB</strong></p>`;
	mainInfo.innerHTML += `<p>Last Analysis Date: <strong>${timeAgo(attributes.last_analysis_date)}</strong></p>`;
	fileSection.innerHTML += `<hr>`;

	// ایجاد آکاردیون برای نتایج دقیق آنتی ویروس‌ها
	const accordionId = `accordion-${fileName.replace(/\s+/g, '-')}`;

	const accordion = document.createElement('div');
	accordion.className = 'accordion';
	accordion.id = accordionId;

	let accordionContent = `
        <div class="accordion-item">
            <h2 class="accordion-header" id="heading-${accordionId}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${accordionId}" aria-expanded="true" aria-controls="collapse-${accordionId}" style="font-size: 17px !important;">
                    Read more
                </button>
            </h2>
            <div id="collapse-${accordionId}" class="accordion-collapse collapse" aria-labelledby="heading-${accordionId}" data-bs-parent="#${accordionId}">
                <div class="accordion-body row">
    `;

	// مرتب کردن نتایج بر اساس اولویت: ویروسی‌ها در ابتدا نمایش داده می‌شوند
	const sortedResults = Object.keys(last_analysis_results).sort((a, b) => {
		const categoryA = last_analysis_results[a].category;
		const categoryB = last_analysis_results[b].category;

		if (categoryA === 'malicious' && categoryB !== 'malicious') return -1;
		if (categoryA !== 'malicious' && categoryB === 'malicious') return 1;
		return 0;
	});

	// اضافه کردن نتایج دقیق به آکاردیون
	sortedResults.forEach((engine) => {

		const result = last_analysis_results[engine];
		const statusClass = result.category === 'undetected' ? 'status-clean' :
			result.category === 'malicious' ? 'status-malicious' : 'status-unknown';

		accordionContent += `
        <div class="col-lg-4 main-card">
            <div class="card">
                <div class="d-flex justify-content-between align-items-center">
                    <span style="font-weight: 600;">${engine}</span>
                    <span class="status ${statusClass}">${result.result || result.category}</span>
                </div>
            </div>
        </div>
    `;
	});

	// پایان آکاردیون
	accordionContent += `
                </div>
            </div>
        </div>
    `;

	accordion.innerHTML = accordionContent;
	fileSection.appendChild(accordion);

	ShowLoading(false);
}

function displayStreamingResults(attributes, fileName) {

	resultsContainer.innerHTML = "";

	const fileSec = document.createElement('div');
	fileSec.className = 'file-section';
	resultsContainer.appendChild(fileSec);

	const { stats, results } = attributes;
	const totalAVs = stats.harmless + stats.malicious + stats.suspicious + stats.undetected + stats.timeout;
	const maliciousAVs = stats.malicious;

	// نمایش نام فایل و نتیجه اسکن
	fileSec.innerHTML += `<p><strong>File Name: </strong> ${fileName}</p>`;
	fileSec.innerHTML += `<p><strong>Scan result: </strong><span style="color:${maliciousAVs > 1 ? "red" : "#4caf50"}; font-size: 18px;">${maliciousAVs} of ${totalAVs}</span></p>`;

	const accordionId = `accordion-${fileCounter}`;
	const accordion = document.createElement('div');
	accordion.className = 'accordion';
	accordion.id = accordionId;

	let accordionContent = `
        <div class="accordion-item">
            <h2 class="accordion-header" id="heading-${accordionId}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${accordionId}" aria-expanded="true" aria-controls="collapse-${accordionId}">
                    Click for Details
                </button>
            </h2>
            <div id="collapse-${accordionId}" class="accordion-collapse collapse" aria-labelledby="heading-${accordionId}" data-bs-parent="#${accordionId}">
                <div class="accordion-body row">
    `;

	// مرتب‌سازی نتایج بر اساس اولویت: ویروسی‌ها در ابتدا نمایش داده می‌شوند
	const sortedResults = Object.keys(results).sort((a, b) => {
		const categoryA = results[a].category;
		const categoryB = results[b].category;

		if (categoryA === 'malicious' && categoryB !== 'malicious') return -1;
		if (categoryA !== 'malicious' && categoryB === 'malicious') return 1;
		return 0;
	});

	// اضافه کردن نتایج دقیق به آکاردیون
	sortedResults.forEach((engine) => {
		const result = results[engine];
		const statusClass = result.category === 'undetected' ? 'status-clean' :
			result.category === 'malicious' ? 'status-malicious' : 'status-unknown';

		accordionContent += `
            <div class="col-lg-4 main-card">
                <div class="card">
                    <div class="d-flex justify-content-between align-items-center">
                        <span style="font-weight: 600;">${engine}</span>
                        <span class="status ${statusClass}">${result.result || result.category}</span>
                    </div>
                </div>
            </div>
        `;
	});

	accordionContent += `
                </div>
            </div>
        </div>
    `;

	accordion.innerHTML = accordionContent;
	fileSec.appendChild(accordion);

	ShowLoading(false);
}
