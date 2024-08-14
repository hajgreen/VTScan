function ShowLoading(bool) {

    if (bool) {
        document.body.style.overflowY = "hidden";
        document.getElementById('loading').style.display = 'flex';
    }
    else {
        document.body.style.overflowY = "auto";
        document.getElementById('loading').style.display = 'none';
    }
}

module.exports = { ShowLoading };