import sharp from "sharp";
import { driveFindImageBySKU } from "../integrations/driveService.js";
import { doInEveryProduct } from "./doInEveryProduct.js";
import getTokenAndStore from "./getTokenAndStore.js";
import waitingConfirmation from "./waitingConfirmation.js"

const fetchWithRetry = async (url, options, maxRetries = 5, delay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, options);

        if (res.status !== 429) return res;

        console.warn(`⏳ Esperando por límite de velocidad (429). Reintento ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }

    throw new Error("❌ Se excedió el límite de reintentos por error 429");
};

//MODOS fill o disproportion
const adjustMarginPictures = async (product, skuBuscados, token, store, mode) => {
    const sku = product.variants?.[0]?.sku;
    const productId = product.id;
    const tiendaImageURL = product.images?.[0]?.src;

    if (skuBuscados.some((skuObjetivo) => skuObjetivo === sku)) {
        try {
            console.log(`🔍 Analizando imagen original de Tienda Nube para SKU: ${sku} (ID: ${productId})`);

            // Descargar imagen de Tienda Nube para análisis
            const response = await fetch(tiendaImageURL);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Recortar y obtener dimensiones
            const trimmedBuffer = await sharp(buffer).trim().toBuffer();
            const metadata = await sharp(trimmedBuffer).metadata();
            const { width, height } = metadata;

            const aspectRatio = width / height;

            // if (aspectRatio <= 2.0) {
            //     console.log("📐 Imagen con aspecto normal. Se saltea.");
            //     return;
            // }

            console.log("📐 Imagen muy alargada hacia los costados. Se va a tratar.");
            console.log(product.canonical_url);
            // await waitingConfirmation();

            // Buscar imagen en Drive si existe
            const driveImageURL = await driveFindImageBySKU(sku);
            const finalImageURL = driveImageURL || tiendaImageURL;

            // Descargar imagen elegida
            const finalResponse = await fetch(finalImageURL);
            const finalArrayBuffer = await finalResponse.arrayBuffer();
            const finalBufferOriginal = Buffer.from(finalArrayBuffer);

            // Recortar y aplicar márgenes
            const finalTrimmed = await sharp(finalBufferOriginal).trim().toBuffer();
            const finalBuffer = await sharp(finalTrimmed)
                .extend({
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .resize(1024, 768, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .toBuffer();

            const base64Image = finalBuffer.toString('base64');

            // 🗑️ Eliminar imagen principal actual
            const existingImagesRes = await fetchWithRetry(`https://api.tiendanube.com/v1/${store}/products/${productId}/images`, {
                headers: {
                    "Authentication": `bearer ${token}`,
                    "User-Agent": "Drive images to products (ezequiasherrera99@gmail.com)"
                }
            });
            const existingImages = await existingImagesRes.json();

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

            // 📤 Subir imagen nueva
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

    //Provoletera 1241218

    const skuBuscados = [
        "5001382", "5001381", "5001254", "5001380", "1273146", "1273144", "1273142", "1187520",
        "1229706", "1204130", "1243900", "1205300", "1204810", "1243562", "1242368", "1242364",
        "1242370", "1242366", "1242362", "1242350", "1242355", "1243160", "1242340", "1270204",
        "1143009", "1143007", "1143005", "1143003", "1143001", "1205186", "1229711", "1180600",
        "1228210", "1228203", "1235028", "1204350", "1235351", "1099662", "1500005", "1500003",
        "1204526", "1135960", "1135959", "1073404", "1185168", "1185173", "1277700", "1277600",
        "1278100", "1185171", "1185167", "1187150", "1185165", "1185166", "1013767", "1185174",
        "1185172", "1045688", "1045470", "1101761", "1198317", "1200796", "1039260", "1180465",
        "1180460", "1180464", "1180462", "1180463", "1180466", "1249945", "1200795", "1229710",
        "1229714", "1185175", "1135745"
    ];

    doInEveryProduct(
        (product) => adjustMarginPictures(product, skuBuscados, access.token, access.store, "fill"),
        access.token,
        access.store)
}