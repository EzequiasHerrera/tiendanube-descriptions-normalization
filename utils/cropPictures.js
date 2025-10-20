import sharp from "sharp";
import {
  downloadDriveImageBufferById,
  downloadDriveImageBufferBySKU,
  driveFindImageBySKU,
} from "../integrations/driveService.js";
import waitingConfirmation from "./waitingConfirmation.js";
import { fetchWithRetry } from "./fetchWithRetry.js";
import getTokenAndStore from "./getTokenAndStore.js";

export const adjustMarginPictures = async (product, mode) => {
  const { token, store } = getTokenAndStore();
  const sku = product.variants?.[0]?.sku;
  const productId = product.id;
  const tiendaImageURL = product.images?.[0]?.src;

  console.log(`🔍 Analizando imagen para SKU: ${sku} (ID: ${productId})`);

  let buffer;
  let source = "Tienda Nube";

  // Intentar descargar imagen de Tienda Nube
  try {
    const response = await fetch(tiendaImageURL);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      console.warn(`⚠️ Imagen de Tienda Nube no disponible (status: ${response.status})`);
    }
  } catch (err) {
    console.warn(`⚠️ Error al descargar imagen de Tienda Nube: ${err.message}`);
  }

  // Si no se pudo usar Tienda Nube, buscar en Drive
  // if (!buffer || buffer.length === 0) {
  const driveArrayBuffer = await downloadDriveImageBufferBySKU(sku);
  console.log(driveArrayBuffer);
  if (!driveArrayBuffer) {
    console.warn("❌ No se encontró imagen en Drive.");
    return;
  }
  try {
    buffer = Buffer.from(driveArrayBuffer);
    source = "Drive";
  } catch (err) {
    console.error(`❌ Error al descargar imagen de Drive: ${err.message}`);
    return;
  }
  // }

  if (!buffer || buffer.length === 0) {
    console.warn("⚠️ La imagen descargada está vacía.");
    return;
  }

  // Recortar y obtener dimensiones
  const trimmedBuffer = await sharp(buffer).trim().toBuffer();
  const metadata = await sharp(trimmedBuffer).metadata();
  const { width, height } = metadata;
  const aspectRatio = width / height;

  // if (aspectRatio <= 2.0) {
  //     console.log("📐 Imagen con aspecto normal. Se saltea.");
  //     return;
  // }

  // console.log(`📐 Imagen alargada detectada (${source}). Se va a tratar.`);
  console.log(product.canonical_url);

  // Aplicar márgenes y redimensionar
  const finalBuffer = await sharp(trimmedBuffer)
    .extend({
      top: 60,
      bottom: 60,
      left: 60,
      right: 60,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .resize(1024, 768, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  const base64Image = finalBuffer.toString("base64");

  // 🗑️ Eliminar imagen principal actual
  const existingImagesRes = await fetchWithRetry(
    `https://api.tiendanube.com/v1/${store}/products/${productId}/images`,
    {
      headers: {
        Authentication: `bearer ${token}`,
        "User-Agent": "Drive images to products (ezequiasherrera99@gmail.com)",
      },
    }
  );
  const existingImages = await existingImagesRes.json();

  if (Array.isArray(existingImages) && existingImages.length > 0) {
    const imagenPrincipal = existingImages.reduce(
      (min, img) => (img.position < min.position ? img : min),
      existingImages[0]
    );

    const deleteRes = await fetchWithRetry(
      `https://api.tiendanube.com/v1/${store}/products/${productId}/images/${imagenPrincipal.id}`,
      {
        method: "DELETE",
        headers: {
          Authentication: `bearer ${token}`,
          "User-Agent":
            "Drive images to products (ezequiasherrera99@gmail.com)",
        },
      }
    );

    if (deleteRes.ok) {
      console.log(
        `🗑️ Imagen eliminada: ${imagenPrincipal.id} (posición ${imagenPrincipal.position})`
      );
    } else {
      console.warn(`⚠️ No se pudo eliminar imagen: ${imagenPrincipal.id}`);
    }
  }

  await waitingConfirmation(store);
  await waitingConfirmation(token);

  // 📤 Subir imagen nueva
  const uploadRes = await fetchWithRetry(
    `https://api.tiendanube.com/v1/${store}/products/${productId}/images`,
    {
      method: "POST",
      headers: {
        Authentication: `bearer ${token}`,
        "User-Agent": "Drive images to products (ezequiasherrera99@gmail.com)",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: `${sku}.jpg`,
        position: 1,
        attachment: base64Image,
      }),
    }
  );

  const result = await uploadRes.json();

  if (uploadRes.ok && result.id) {
    console.log(`✅ Imagen subida correctamente como base64 para SKU ${sku}`);
  } else {
    console.error(`❌ Falló la subida:`, result);
  }
};
