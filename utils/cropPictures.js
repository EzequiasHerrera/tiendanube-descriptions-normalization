import { downloadDriveImageBufferBySKU } from "../integrations/driveService.js";
import waitingConfirmation from "./waitingConfirmation.js";
import { fetchWithRetry } from "./fetchWithRetry.js";
import {
	cropImageAndAddMargin,
	getImageBuffer,
} from "../services/imagesService.js";

export const adjustMarginPictures = async (product, token, store, mode) => {
	const sku = product.variants?.[0]?.sku;
	const productId = product.id;
	const tiendaImageURL = product.images?.[0]?.src;

	console.log(`🔍 Analizando imagen para SKU: ${sku} (ID: ${productId})`);

	const tiendaNubeBuffer = await getImageBuffer(tiendaImageURL);
	const driveArrayBuffer = await downloadDriveImageBufferBySKU(sku);

  await waitingConfirmation(product.canonical_url);

	if (!driveArrayBuffer || driveArrayBuffer.length === 0) {
		console.warn("⚠️ La imagen descargada está vacía en Drive.");
		return;
	}

	if (!tiendaNubeBuffer || tiendaNubeBuffer.length === 0) {
		console.warn("⚠️ La imagen descargada está vacía en TN.");
		return;
	}

	// Recortar, aplicar márgenes y redimensionar
	const finalBuffer = await cropImageAndAddMargin(driveArrayBuffer, 60);
	//Transformar a Base64
  console.log("Base64Image");
	const base64Image = finalBuffer.toString("base64");

	// 🗑️ Eliminar imagen principal actual
	const existingImagesRes = await fetchWithRetry(
		`https://api.tiendanube.com/v1/${store}/products/${productId}/images`,
		{
			headers: {
				Authentication: `bearer ${token}`,
				"User-Agent":
					"Drive images to products (ezequiasherrera99@gmail.com)",
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
			console.warn(
				`⚠️ No se pudo eliminar imagen: ${imagenPrincipal.id}`
			);
		}
	}

	// 📤 Subir imagen nueva
	const uploadRes = await fetchWithRetry(
		`https://api.tiendanube.com/v1/${store}/products/${productId}/images`,
		{
			method: "POST",
			headers: {
				Authentication: `bearer ${token}`,
				"User-Agent":
					"Drive images to products (ezequiasherrera99@gmail.com)",
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
		console.log(
			`✅ Imagen subida correctamente como base64 para SKU ${sku}`
		);
	} else {
		console.error(`❌ Falló la subida:`, result);
	}
};
