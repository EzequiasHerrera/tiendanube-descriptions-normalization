import sharp from "sharp";
import { driveFindImageBySKU } from "../integrations/driveService.js";
import { doInEveryProduct } from "./doInEveryProduct.js";
import getTokenAndStore from "./getTokenAndStore.js";

const fetchWithRetry = async (url, options, maxRetries = 5, delay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, options);

        if (res.status !== 429) return res;

        console.warn(`⏳ Esperando por límite de velocidad (429). Reintento ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }

    throw new Error("❌ Se excedió el límite de reintentos por error 429");
};

const adjustMarginPictures = async (product, skuPermitidos, token, store) => {
    const sku = product.variants?.[0]?.sku;

    if (skuPermitidos.includes(sku)) {
        const productId = product.id;
        const imageURL = await driveFindImageBySKU(sku);

        try {
            console.log(`🔧 Procesando SKU: ${sku} (ID: ${productId})`);

            const metadata = await sharp(buffer).metadata();
            const { width, height } = metadata;

            const aspectRatio = width / height;
            
            // Descargar imagen y convertir a buffer
            const response = await fetch(imageURL);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Recortar imagen
            const trimmedBuffer = await sharp(buffer)
                .trim()
                .extend({
                    top: 80,
                    bottom: 80,
                    left: 80,
                    right: 80,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .toBuffer();

            const base64Image = trimmedBuffer.toString('base64');

            // 🗑️ Eliminar imagen en posición 1 si existe
            const existingImagesRes = await fetchWithRetry(`https://api.tiendanube.com/v1/${store}/products/${productId}/images`, {
                headers: {
                    "Authentication": `bearer ${token}`,
                    "User-Agent": "Drive images to products (ezequiasherrera99@gmail.com)"
                }
            });
            const existingImages = await existingImagesRes.json();

            // 🗑️ Eliminar imagen con menor posición (la que actúa como principal)
            if (Array.isArray(existingImages) && existingImages.length > 0) {
                const imagenPrincipal = existingImages.reduce((min, img) => {
                    return img.position < min.position ? img : min;
                }, existingImages[0]);

                const deleteRes = await fetchWithRetry(`https://api.tiendanube.com/v1/${store}/products/${productId}/images/${imagenPrincipal.id}`, {
                    method: 'DELETE',
                    headers: {
                        "Authentication": `bearer ${token}`,
                        "User-Agent": "Drive images to products (ezequiasherrera99@gmail.com)"
                    }
                });

                if (deleteRes.ok) {
                    console.log(`🗑️ Imagen eliminada: ${imagenPrincipal.id} (posición ${imagenPrincipal.position})`);
                } else {
                    console.warn(`⚠️ No se pudo eliminar imagen: ${imagenPrincipal.id}`);
                }
            }

            const uploadRes = await fetchWithRetry(`https://api.tiendanube.com/v1/${store}/products/${productId}/images`, {
                method: 'POST',
                headers: {
                    "Authentication": `bearer ${token}`,
                    "User-Agent": "Drive images to products (ezequiasherrera99@gmail.com)",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filename: `${sku}.jpg`,
                    position: 1,
                    attachment: base64Image
                })
            });

            const result = await uploadRes.json();

            if (uploadRes.ok && result.id) {
                console.log(`✅ Imagen subida correctamente como base64 para SKU ${sku}`);
            } else {
                console.error(`❌ Falló la subida:`, result);
            }

        } catch (error) {
            console.error("❌ Error al procesar la imagen:", error.message);
        }
    }
};

export const cropPicturesFromTiendaNube = async () => {
    const access = getTokenAndStore("KTGASTRO");

    const skuPermitidos = [
        "1198320", "1500002", "1500001", "1500000", "1128611", "1254724", "1143969", "1128612",
        "1500240", "1500250", "1500241", "1079200", "1165200", "1079205", "1500172", "1500171",
        "1165330", "1079060", "1079061", "1079062", "1079063", "1079064", "1042998", "1079065",
        "1079066", "1079067", "1079068", "1079069", "1079070", "1185055", "1500109", "1143955",
        "1143942", "1143943", "1143941", "1165000", "1088110", "1088151", "1088100", "1088150",
        "1228209", "1228213", "1088210", "1088200", "1088360", "1088250", "1088070", "1088050",
        "1088230", "1088220", "1088551", "1088550", "1088505", "1088500", "1228208", "1228212",
        "1088074", "1085705", "1203100", "1235029", "1088010", "1088310", "1088000", "1088305",
        "1088351", "1088350", "1228207", "1228211", "1088410", "1088400", "1239110", "1203200",
        "1205154", "1203300", "1203400", "1205178", "1203500", "1203600", "1203610", "5000830",
        "1236201", "1140477"
    ];

    doInEveryProduct(
        (product) => adjustMarginPictures(product, skuPermitidos, access.token, access.store),
        access.token,
        access.store)
}