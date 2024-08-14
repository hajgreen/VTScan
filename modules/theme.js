const Store = require('electron-store');
const store = new Store();

//dark mode
function isStyleSheetLoaded(href) {
    const links = document.getElementsByTagName('link');
    for (let i = 0; i < links.length; i++) {
        if (links[i].rel === 'stylesheet' && links[i].href.includes(href)) {
            return true;
        }
    }
    return false;
}

async function change_mode(href = 'style_dark.css') {
    if (isStyleSheetLoaded(href)) {
        // اگر فایل لود شده بود، آن را حذف کن
        const links = document.getElementsByTagName('link');
        for (let i = 0; i < links.length; i++) {
            if (links[i].rel === 'stylesheet' && links[i].href.includes(href)) {

                document.getElementById("dark-mode-icon").style.display = "block";
                document.getElementById("light-mode-icon").style.display = "none";
                document.getElementById("dark-mode-text").innerText = "Dark mode";

                store.set('theme', 'light');

                links[i].parentNode.removeChild(links[i]);
                return;
            }
        }
    } else {
        // اگر فایل لود نشده بود، آن را اضافه کن
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);

        document.getElementById("light-mode-icon").style.display = "block";
        document.getElementById("dark-mode-icon").style.display = "none";
        document.getElementById("dark-mode-text").innerText = "Light mode";

        store.set('theme', 'dark');
    }
}

async function setTheme() {

    const theme = store.get('theme');

    if (theme == "dark") {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'style_dark.css';
        document.head.appendChild(link);

        document.getElementById("light-mode-icon").style.display = "block";
        document.getElementById("dark-mode-icon").style.display = "none";
        document.getElementById("dark-mode-text").innerText = "Light mode";
    }
} setTheme();

module.exports = { change_mode };