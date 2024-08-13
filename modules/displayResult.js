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

module.exports = { displayResults, displayStreamingResults };