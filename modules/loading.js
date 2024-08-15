function ShowLoading(bool) {

    if (bool) {
        document.body.style.overflowY = "hidden";
        document.getElementById('loading').style.display = 'flex';
    }
    else {
        document.body.style.overflowY = "auto";
        document.getElementById('loading').style.display = 'none';
    }

    setTimeout(() => {
        document.body.style.overflowY = "auto";
        document.getElementById('loading').style.display = 'none';
    }, 10000);
}

module.exports = { ShowLoading };