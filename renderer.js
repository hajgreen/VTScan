const { change_mode } = require('./modules/theme');
const { getApiKey, checkFileHash } = require('./modules/virusTotal');
const { handleFile, handleMultipleFiles } = require('./modules/fileHandling');
const { uploadFile, rescanFile } = require('./modules/apiUtils');
const { ShowLoading } = require('./modules/loading');
const { timeAgo } = require('./modules/time');
const { displayResults, displayStreamingResults } = require('./modules/displayResult');
const { searchFiles, orderBy } = require('./modules/search');
require('./modules/contextMenu');
require('./modules/events');
require('./modules/usbScan');

const resultsContainer = document.getElementById('results');