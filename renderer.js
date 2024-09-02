const { change_mode } = require('./modules/theme');
const { getApiKey, checkFileHash } = require('./modules/virusTotal');
const { handleFile, handleMultipleFiles, deleteFile } = require('./modules/fileHandling');
const { uploadFile, rescanFile } = require('./modules/apiUtils');
const { ShowLoading } = require('./modules/loading');
const { timeAgo } = require('./modules/time');
const { displayResults, displayStreamingResults } = require('./modules/displayResult');
const { searchFiles, orderBy } = require('./modules/search');
const { openSettings } = require('./modules/pageRoute');
const { createSimulatedFile } = require('./modules/usbScan');
require('./modules/contextMenu');
require('./modules/events');

const resultsContainer = document.getElementById('results');