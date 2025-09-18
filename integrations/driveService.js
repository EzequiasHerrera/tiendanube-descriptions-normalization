import { google } from 'googleapis';
import { oauth2Client } from './googleAuth.js';

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function driveFindImageBySKU(sku) {
    const res = await drive.files.list({ // si quisiera que traiga el array de fotos que contengan el SKU coloco "and name contains '${sku}'" and name = '${sku}.jpg'
        q: `'1-R_zY7rBbem5DmHclokxLZF-wYsdvjep' in parents and name = '${sku}.jpg' and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name)',
        orderBy: 'name'
    });
    if (res.data.files.length > 0) {
        const file = res.data.files[0];
        console.log(`https://drive.google.com/uc?export=view&id=${file.id}`);
        return `https://drive.google.com/uc?export=view&id=${file.id}`;
    }
    console.log("No existe")
    return null;
}

export async function getDriveFileName(fileId) {
    const res = await drive.files.get({
        fileId,
        fields: 'name'
    });

    return res.data.name;
}

driveFindImageBySKU(5000830);