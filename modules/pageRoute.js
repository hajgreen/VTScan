const { ipcRenderer } = require('electron');

function openSettings() {
    ipcRenderer.send('open-settings');
}
module.exports = { openSettings };