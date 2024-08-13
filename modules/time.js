function timeAgo(timestamp) {
    // Convert seconds to milliseconds
    const timeInMs = timestamp * 1000;
    const now = new Date();
    const secondsPast = Math.floor((now.getTime() - timeInMs) / 1000);

    if (secondsPast < 60) {
        return `${secondsPast} seconds ago`;
    }
    if (secondsPast < 3600) {
        const minutesPast = Math.floor(secondsPast / 60);
        return `${minutesPast} minutes ago`;
    }
    if (secondsPast < 86400) {
        const hoursPast = Math.floor(secondsPast / 3600);
        return `${hoursPast} hours ago`;
    }
    if (secondsPast < 2592000) {
        const daysPast = Math.floor(secondsPast / 86400);
        return `${daysPast} days ago`;
    }
    if (secondsPast < 31536000) {
        const monthsPast = Math.floor(secondsPast / 2592000);
        return `${monthsPast} months ago`;
    }
    const yearsPast = Math.floor(secondsPast / 31536000);
    return `${yearsPast} years ago`;
}

module.exports = { timeAgo };