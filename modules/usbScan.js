const usb = require('usb');

// فهرست کردن تمام دستگاه‌های USB متصل
const devices = usb.getDeviceList();

devices.forEach(device => {
    console.log('USB Device:', device.deviceDescriptor);
});

module.exports = {};