const { change_mode } = require('./modules/darkMode');
const { getApiKey, checkFileHash } = require('./modules/virusTotal');
const { handleFile, handleMultipleFiles } = require('./modules/fileHandling');
const { uploadFile } = require('./modules/apiUtils');
const { ShowLoading } = require('./modules/loading');
const { timeAgo } = require('./modules/time');
const { displayResults, displayStreamingResults } = require('./modules/displayResult');
require('./modules/contextMenu');
require('./modules/events');

const resultsContainer = document.getElementById('results');
const loadingStep = document.getElementById('loading-step');

var filesLength = 0;
var fileCounter = 1;