function searchFiles() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const fileSections = document.querySelectorAll('div.file-section');

    fileSections.forEach(section => {
        // Ensure .main-info exists before accessing its children
        const mainInfo = section.querySelector('.main-info');

        if (input == "") {
            section.style.display = 'block';
            return;
        }

        if (!mainInfo) {
            section.style.display = 'none';  // Hide sections without .main-info
            return;
        }

        // Get the "File Name" paragraph, which is the second child element of the .main-info div
        const fileNameElement = mainInfo.children[1];
        const fileName = fileNameElement ? fileNameElement.querySelector('strong').innerText.toLowerCase() : '';

        if (fileName.includes(input)) {
            section.style.display = '';  // Show the section
        } else {
            section.style.display = 'none';  // Hide the section
        }
    });
}

function parseFileSize(sizeText) {
    const sizeMatch = sizeText.match(/([\d.]+)\s*(MB|GB)/);
    if (sizeMatch) {
        let size = parseFloat(sizeMatch[1]);
        if (sizeMatch[2] === 'GB') {
            size *= 1024; // Convert GB to MB
        }
        return size;
    }
    return 0;
}

function parseScanResult(scanText) {
    const match = scanText.match(/(\d+)\s*of\s*(\d+)/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0;
}

function parseDate(dateText) {
    // Handle relative dates
    const now = new Date();
    const relativeDateMatch = dateText.match(/(\d+)\s*(days|months|years|hours|minutes|seconds)\s*ago/);
    if (relativeDateMatch) {
        const value = parseInt(relativeDateMatch[1], 10);
        const unit = relativeDateMatch[2];
        const pastDate = new Date(now);

        switch (unit) {
            case 'days':
                pastDate.setDate(now.getDate() - value);
                break;
            case 'months':
                pastDate.setMonth(now.getMonth() - value);
                break;
            case 'years':
                pastDate.setFullYear(now.getFullYear() - value);
                break;
            case 'hours':
                pastDate.setHours(now.getHours() - value);
                break;
            case 'minutes':
                pastDate.setMinutes(now.getMinutes() - value);
                break;
            case 'seconds':
                pastDate.setSeconds(now.getSeconds() - value);
                break;
        }

        return pastDate;
    }

    // Handle absolute dates in format "YYYY-MM-DD HH:MM:SS"
    const absoluteDate = new Date(dateText);
    return isNaN(absoluteDate) ? new Date(0) : absoluteDate;
}

function orderBy(parameter) {
    const resultsContainer = document.getElementById('results');
    const fileSections = Array.from(document.querySelectorAll('div.file-section'));

    fileSections.sort((a, b) => {
        const aMainInfo = a.querySelector('.main-info');
        const bMainInfo = b.querySelector('.main-info');

        // Move items with missing .main-info to the end
        if (!aMainInfo && bMainInfo) {
            return 1; // a should be after b
        }
        if (aMainInfo && !bMainInfo) {
            return -1; // b should be after a
        }
        if (!aMainInfo && !bMainInfo) {
            return 0; // both should be considered equal
        }

        let aValue, bValue;

        switch (parameter) {
            case 'fileName':
                const aFileName = aMainInfo.children[0].querySelector('strong');
                const bFileName = bMainInfo.children[0].querySelector('strong');
                aValue = aFileName ? aFileName.innerText.toLowerCase() : '';
                bValue = bFileName ? bFileName.innerText.toLowerCase() : '';
                return aValue.localeCompare(bValue);
            case 'fileSize':
                const aFileSize = aMainInfo.children[3];
                const bFileSize = bMainInfo.children[3];
                aValue = aFileSize ? parseFileSize(aFileSize.innerText) : 0;
                bValue = bFileSize ? parseFileSize(bFileSize.innerText) : 0;
                return bValue - aValue; // Descending order
            case 'lastAnalysisDate':
                const aDateText = aMainInfo.children[1];
                const bDateText = bMainInfo.children[1];
                aValue = aDateText ? parseDate(aDateText.innerText) : new Date(0);
                bValue = bDateText ? parseDate(bDateText.innerText) : new Date(0);
                return bValue - aValue; // Descending order
            case 'scanResult':
                const aScanResult = a.querySelector('.positives');
                const bScanResult = b.querySelector('.positives');
                aValue = aScanResult ? parseInt(aScanResult.innerText, 10) : 0;
                bValue = bScanResult ? parseInt(bScanResult.innerText, 10) : 0;
                return bValue - aValue; // Descending order
            default:
                return 0;
        }
    });

    fileSections.forEach(section => resultsContainer.appendChild(section));
}

module.exports = { searchFiles, orderBy };