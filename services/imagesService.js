import sharp from "sharp";
import { downloadDriveImageBufferBySKU } from "../integrations/driveService.js";
import getTokenAndStore from "../utils/getTokenAndStore.js";
import waitingConfirmation from "../utils/waitingConfirmation.js";
import { getProductBySKU } from "./productsService.js";
import looksSame from "looks-same";
import fs from "fs/promises";

let cont = 0;

export const getImageBuffer = async (url) => {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      console.warn(
        `⚠️ Imagen de Tienda Nube no disponible (status: ${response.status})`
      );
    }
  } catch (err) {
    console.warn(`⚠️ Error al descargar imagen de Tienda Nube: ${err.message}`);
  }
};

export async function compareImagesTNandDrive(product) {
  const sku = product.variants?.[0]?.sku;
  const bufferTN = await getImageBuffer(product.images?.[0]?.src);
  const bufferDRIVE = await downloadDriveImageBufferBySKU(sku);

  if (!bufferTN || !bufferDRIVE) {
    throw new Error("❌ No se pudieron obtener ambas imágenes.");
  }

  const pngTN = await sharp(await cropImage(bufferTN))
    .resize(300, 300, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const pngDRIVE = await sharp(await cropImage(bufferDRIVE))
    .resize(300, 300, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const pathTN = "./comparacion/imgTN.png";
  const pathDRIVE = "./comparacion/imgDRIVE.png";
  const pathDIFF = "./comparacion/diff.png";

  await fs.mkdir("./comparacion", { recursive: true });
  await fs.writeFile(pathTN, pngTN);
  await fs.writeFile(pathDRIVE, pngDRIVE);

  // console.log("✅ Imágenes guardadas. Comparando...");

  const { equal } = await looksSame(pathTN, pathDRIVE, {
    tolerance: 90,
    ignoreAntialiasing: true,
    strict: false,
  });

  console.log(
    equal
      ? `✅ Visualmente iguales: ${sku}`
      : `❌ Visualmente distintas: ${sku}`
  );

  await looksSame.createDiff({
    reference: pathTN,
    current: pathDRIVE,
    diff: pathDIFF,
    highlightColor: "#ff00ff",
    tolerance: 90,
    ignoreAntialiasing: true,
  });

  console.log("🖼️ Mapa de diferencias guardado en:", pathDIFF);
  if (equal == false) {
    cont++;
    console.log(`Cantidad que no coinciden: ${cont}`);
  }

  return equal;
}

export async function cropImageAndAddMargin(buffer, margin) {
  const trimmedBuffer = await sharp(buffer).trim().toBuffer();

  const finalBuffer = await sharp(trimmedBuffer)
    .extend({
      top: margin,
      bottom: margin,
      left: margin,
      right: margin,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  return finalBuffer;
}

export async function compareImages(sku) {
  const normalizedTN = await cropImageAndAddMargin(bufferTN, 60);
  const normalizedDRIVE = await cropImageAndAddMargin(bufferDRIVE, 60);
}

export async function cropImage(buffer) {
  return await sharp(buffer).trim().toBuffer();
}