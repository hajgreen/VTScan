function truncateString(str, num) {
    if (str.length <= num) {
        return str;
    }

    const partLength = Math.floor((num - 5) / 2);
    const firstPart = str.substring(0, partLength);
    const lastPart = str.substring(str.length - partLength);

    return `${firstPart} ... ${lastPart}`;
}

function displayResults(attributes, fileName, fileSection, file = undefined, hash) {

    const { last_analysis_stats, last_analysis_results } = attributes;
    const totalAVs = last_analysis_stats.harmless + last_analysis_stats.malicious + last_analysis_stats.suspicious + last_analysis_stats.undetected + last_analysis_stats.timeout;
    const maliciousAVs = last_analysis_stats.malicious;

    const mainInfo = document.createElement('div');
    mainInfo.classList.add("main-info");
    const mainData = document.createElement('div');
    mainData.classList.add("main-data");

    fileSection.appendChild(mainData);

    mainData.innerHTML += `
        <div class="engines" style="background-color: ${maliciousAVs > 1 ? "#f44336cc" : "#00aa00b0"};">
            <div class="circle">
                <div class="positives" style="color: ${maliciousAVs > 1 ? "#f44336cc" : "#00aa00b0"};">
                    ${maliciousAVs}
                </div> 
                <div class="total">
                    / ${totalAVs}
                </div>
            </div>  
        </div>
    `;

    mainData.appendChild(mainInfo);

    // نمایش اطلاعات کلی
    mainInfo.innerHTML += `<p>File Size: <strong>${(file.size / 1024 / 1024).toFixed(2)} MB</strong></p>`;
    mainInfo.innerHTML += `
    <button class="btn-rescanFile" type="button" onclick="rescanFile('${hash}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
        </svg>
        Rescan file
    </button>`;
    mainInfo.innerHTML += `<p>File Name: <strong>${truncateString(fileName, 32)}</strong></p>`;
    mainInfo.innerHTML += `<p>Last Analysis Date: <strong>${timeAgo(attributes.last_analysis_date)}</strong></p>`;
    mainInfo.innerHTML += `<p>File Hash (SHA-256): ${truncateString(hash, 24)}</p>`;

    // ایجاد آکاردیون برای نتایج دقیق آنتی ویروس‌ها
    const accordionId = `accordion-${fileName.replace(/\s+/g, '-')}`;

    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    accordion.id = accordionId;

    let accordionContent = `
        <div class="accordion-item">
            <h2 class="accordion-header" id="heading-${accordionId}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${accordionId}" aria-expanded="true" aria-controls="collapse-${accordionId}">
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
}

module.exports = { displayResults, displayStreamingResults };