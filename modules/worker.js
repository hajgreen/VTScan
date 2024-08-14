self.onmessage = async function (event) {
    const fileData = new Uint8Array(event.data.fileData);
    const hash = await calculateHash(fileData);
    self.postMessage(hash);
};

async function calculateHash(fileData) {
    const digest = await crypto.subtle.digest('SHA-256', fileData);
    const hashArray = Array.from(new Uint8Array(digest));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}