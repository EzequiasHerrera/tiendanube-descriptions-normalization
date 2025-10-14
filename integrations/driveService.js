import { google } from 'googleapis';
import { oauth2Client } from './googleAuth.js';

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function driveFindImageBySKU(sku, many = false) {
    const q = many ? `name contains '${sku}'` : `name = '${sku}.jpg'`;

    const res = await drive.files.list({
        q: `'1NMgqDd8fzBQV1ShiUWl-waSxxPvsUAaM' in parents and ${q} and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name)',
        orderBy: 'name'
    });

    const files = res.data.files;

    if (!files || files.length === 0) return null;

    if (many) {
        return files.map(file => file.id); // ✅ devuelve array de IDs
    }

    return files[0].id; // ✅ devuelve solo el ID
}

// En downloadDriveImageBuffer.js
export async function downloadDriveImageBuffer(sku) {
    const fileId = await driveFindImageBySKU(sku);
    if (!fileId) return null;

    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
    );

    return Buffer.from(res.data);
}

export async function getDriveFileName(fileId) {
    const res = await drive.files.get({
        fileId,
        fields: 'name'
    });

    return res.data.name;
}

// driveFindImageBySKU("1263010").then(res => console.log("Resultado:", res));