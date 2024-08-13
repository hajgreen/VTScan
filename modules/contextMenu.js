const { ipcRenderer } = require('electron');

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

module.exports = {};