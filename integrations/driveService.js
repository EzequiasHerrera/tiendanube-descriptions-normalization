import { google } from "googleapis";
import { oauth2Client } from "./googleAuth.js";
import waitingConfirmation from "../utils/waitingConfirmation.js";

const drive = google.drive({ version: "v3", auth: oauth2Client });

const folderA = "1-R_zY7rBbem5DmHclokxLZF-wYsdvjep"; // origen
const folderB = "1NMgqDd8fzBQV1ShiUWl-waSxxPvsUAaM"; // destino

export async function driveFindImageBySKU(sku, many = false) {
  const q = many ? `name contains '${sku}'` : `name = '${sku}.jpg'`;

  const res = await drive.files.list({
    q: `'1NMgqDd8fzBQV1ShiUWl-waSxxPvsUAaM' in parents and ${q} and mimeType contains 'image/' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name",
  });

  const files = res.data.files;

  if (!files || files.length === 0) return null;

  if (many) {
    return files.map((file) => file.id); // ✅ devuelve array de IDs
  }

  return files[0].id; // ✅ devuelve solo el ID
}

export async function getURLbySKU(sku, many = false) {
  const q = many ? `name contains '${sku}'` : `name = '${sku}.jpg'`;

  const res = await drive.files.list({
    q: `'${folderB}' in parents and ${q} and mimeType contains 'image/' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name",
  });

  const files = res.data.files;

  if (!files || files.length === 0) return null;

  const getPublicURL = (id) => `https://drive.google.com/uc?id=${id}`;

  if (many) {
    return files.map((file) => getPublicURL(file.id));
  }

  return getPublicURL(files[0].id);
}

export const downloadDriveImageBufferById = async (fileId) => {
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data);
};

export const downloadDriveImageBufferBySKU = async (sku) => {
  try {
    const fileId = await driveFindImageBySKU(sku, false);
    if (!fileId) {
      console.warn(`❌ No se encontró imagen para SKU: ${sku}`);
      return null;
    }

    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    return Buffer.from(res.data);
  } catch (err) {
    console.error(
      `❌ Error al descargar imagen por SKU (${sku}): ${err.message}`
    );
    return null;
  }
};

export async function getDriveFileName(fileId) {
  const res = await drive.files.get({
    fileId,
    fields: "name",
  });

  return res.data.name;
}

async function sincronizarImagenesDrive() {
  const getImageFilesFromFolder = async (folderId) => {
    let files = [];
    let pageToken = null;

    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: "nextPageToken, files(id, name)",
        orderBy: "name",
        pageSize: 1000,
        pageToken: pageToken,
      });

      files = files.concat(res.data.files);
      pageToken = res.data.nextPageToken;
    } while (pageToken);

    return files;
  };

  const copiarArchivo = async (fileId, newName) => {
    await drive.files.copy({
      fileId,
      requestBody: {
        name: newName,
        parents: [folderB],
      },
    });
  };

  const [archivosA, archivosB] = await Promise.all([
    getImageFilesFromFolder(folderA),
    getImageFilesFromFolder(folderB),
  ]);

  const nombresB = archivosB.map((file) => file.name);
  const faltantes = archivosA.filter((file) => !nombresB.includes(file.name));

  if (faltantes.length === 0) {
    console.log("✅ Todas las imágenes ya están sincronizadas.");
    return;
  }

  console.log("❌ Las siguientes imágenes faltan en la carpeta B:\n");
  console.log(faltantes.map((f) => f.name).join("\n"));

  // 🔔 Espera confirmación antes de copiar
  await waitingConfirmation();

  console.log("\n📥 Copiando imágenes faltantes a la carpeta B:\n");
  for (const file of faltantes) {
    console.log(file.name);
    await copiarArchivo(file.id, file.name);
  }

  console.log(`\n✅ Se copiaron ${faltantes.length} imágenes faltantes.`);
}