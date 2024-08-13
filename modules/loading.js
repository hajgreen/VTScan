function ShowLoading(bool) {

    if (bool) {
        document.body.style.overflowY = "hidden";
        document.getElementById('loading').style.opacity = '0.9';
        document.getElementById('loading').style.height = '100vh';
    }
    else {
        document.body.style.overflowY = "auto";
        document.getElementById('loading').style.opacity = '0';
        document.getElementById('loading').style.height = '0';
    }
}

module.exports = { ShowLoading };