const fs = require('fs');
const { Snackbar } = require('../data/js/snackbar.js');

function checkSize(path) {
    const fileSize = (((fs.statSync(path).size) / 1024) / 1024).toFixed(2);

    if (fileSize < 650) {
        return true;
    }
    else {
        try {
            new Snackbar(`File size exceeds the 650 MB limit.`, {
                position: 'bottom-right',
                actionText: 'Ok',
                style: {
                    container: [
                        ['background-color', 'red'],
                        ['border-radius', '5px']
                    ],
                    message: [
                        ['color', '#eee'],
                        ['font-size', '16px']
                    ],
                    bold: [
                        ['font-weight', 'bold'],
                    ],
                    actionButton: [
                        ['color', 'white'],
                    ],
                }
            });
        } catch { }


        return false;
    }
}

module.exports = { checkSize };