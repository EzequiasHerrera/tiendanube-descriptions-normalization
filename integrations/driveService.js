import { google } from 'googleapis';
import { oauth2Client } from './googleAuth.js';

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function driveFindImageBySKU(sku, many = false) {
    const q = many ? `name contains '${sku}'` : `name = '${sku}.jpg'`;

    const res = await drive.files.list({
        q: `'1-R_zY7rBbem5DmHclokxLZF-wYsdvjep' in parents and ${q} and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name)',
        orderBy: 'name'
    });

    const files = res.data.files;

    if (!files || files.length === 0) return null;

    if (many) {
        return files.map(file => `https://drive.google.com/uc?export=view&id=${file.id}`);
    }

    return `https://drive.google.com/uc?export=view&id=${files[0].id}`;
}


export async function getDriveFileName(fileId) {
    const res = await drive.files.get({
        fileId,
        fields: 'name'
    });

    return res.data.name;
}