const dropArea = document.getElementById('drop-area');
const resultsContainer = document.getElementById('results');
const fileInput = document.getElementById('file-input');
const folderInput = document.getElementById('folder-input');
const fileSelectButton = document.getElementById('file-select-button');
const folderSelectButton = document.getElementById('folder-select-button');
const loadingStep = document.getElementById('loading-step');

const crypto = require('crypto');
const path = require('path');
const { ipcRenderer } = require('electron');


//Get Api Key
var apiCounter = -1;

async function getApiKey() {
	const api = await ipcRenderer.invoke('get-api-key');

	if (api.length != apiCounter + 1) {
		apiCounter += 1;
	} else {
		apiCounter = 0;
	}

	console.log(api[apiCounter]);

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
	resultsContainer.innerHTML += `<h4 style="margin-bottom: 20px;"><strong>Files count: ${files.length} </strong></h4>`;

	if (files.length > 0) {

		console.log(files);

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
	resultsContainer.innerHTML = "";
	fileInput.click();
});

fileInput.addEventListener('change', async (event) => {
	const files = event.target.files;
	if (files.length > 0) {
		await handleMultipleFiles(files);
	}
});

// Event listener برای انتخاب پوشه از طریق دکمه
folderSelectButton.addEventListener('click', () => {
	resultsContainer.innerHTML = "";
	folderInput.click();
});

var filesLength = 0;
var fileCounter = 0;

folderInput.addEventListener('change', async (event) => {
	const files = event.target.files;
	const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.vbs', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.gadget', '.msc', '.pif', '.reg', '.inf', '.jar', '.py'];

	fileCounter = 2;

	let counter = 0;
	for (let file of files) {
		const ext = path.extname(file.name).toLowerCase();
		if (executableExtensions.includes(ext)) {
			counter++;
		}
	}

	filesLength = counter;

	resultsContainer.innerHTML = "";
	resultsContainer.innerHTML += `<h4 style="margin-bottom: 20px;"><strong>Files count: ${counter} </strong></h4>`;

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

	fileCounter = 1;
	filesLength = files.length;

	resultsContainer.innerHTML = "";
	resultsContainer.innerHTML += `<h4 style="margin-bottom: 20px;"><strong>Files count: ${files.length} </strong></h4>`;

	for (let file of files) {
		fileCounter += 1;
		await handleFile(file);
	}

	ShowLoading(false);
}

// Function برای پردازش فایل انتخابی
async function handleFile(file) {

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
	fileSection.innerHTML += `<p><strong>File Hash (SHA-1):</strong> ${hash}</p>`;

	// بررسی هش در VirusTotal
	await checkFileHash(hash, fileName, fileSection);
}

function calculateHash(fileData) {
	return crypto.createHash('sha1').update(fileData).digest('hex');
}

function ShowLoading(bool) {

	if (bool) {
		document.body.style.overflowY = "hidden";
		document.getElementById('loading').style.display = 'flex';
	}
	else {
		document.body.style.overflowY = "auto";
		document.getElementById('loading').style.display = 'none';
	}
}

async function checkFileHash(hash, fileName, fileSection) {

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
			displayResults(result.data.attributes, fileName, fileSection);
		}
		else if (response.status === 404) {
			fileSection.innerHTML += `<p>File with hash ${hash} not found in VirusTotal database.</p>`;
		}
		else {
			const errorDetails = await response.json();
			fileSection.innerHTML += `<p>Error checking file hash: ${errorDetails.error.message}</p>`;
		}
	} catch (error) {
		fileSection.innerHTML += `<p>Network or fetch error: ${error.message}</p>`;
	}
}

function displayResults(attributes, fileName, fileSection) {
	const { last_analysis_stats, last_analysis_results } = attributes;
	const totalAVs = last_analysis_stats.harmless + last_analysis_stats.malicious + last_analysis_stats.suspicious + last_analysis_stats.undetected + last_analysis_stats.timeout;
	const maliciousAVs = last_analysis_stats.malicious;

	loadingStep.innerHTML = `${fileCounter} of ${filesLength} done`;

	fileSection.innerHTML += `<p><strong>File Name: </strong> ${fileName}</p>`;

	// نمایش اطلاعات کلی
	fileSection.innerHTML += `
        <p><strong>Scan result: </strong><span style="color:${maliciousAVs > 1 ? "red" : "#4caf50"}; font-size: 18px;">${maliciousAVs} of ${totalAVs}</span></p>
    `;

	// ایجاد آکاردیون برای نتایج دقیق آنتی ویروس‌ها
	const accordionId = `accordion-${fileName.replace(/\s+/g, '-')}`;

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

	// اضافه کردن نتایج دقیق به آکاردیون
	Object.keys(last_analysis_results).forEach((engine) => {

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