import { downloadDriveImageBufferById } from "../integrations/driveService.js";
import waitingConfirmation from "./waitingConfirmation.js";

export const imageToBase64 = async (url) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getGoogleAuthToken()}`, // si usás auth de Google
    },
  });

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
};

export const subirImagenesBase64 = async (fileIds = [], token, store, producto) => {
  for (let i = 0; i < fileIds.length; i++) {
    try {
      const buffer = await downloadDriveImageBufferById(fileIds[i]);
      const base64 = buffer.toString("base64");

      const body = {
        attachment: base64,
        position: i + 1,
        filename: producto.sku ? `${producto.sku}_${i + 1}.jpg` : undefined,
      };

      const res = await fetch(
        `https://api.tiendanube.com/v1/${store}/products/${producto.id}/images`,
        {
          method: "POST",
          headers: {
            Authentication: `bearer ${token}`,
            "User-Agent": "Excel Uploader (ezequiasherrera99@gmail.com)",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result = await res.json();
      if (res.ok) {
        console.log(`🖼️ Imagen ${i + 1} subida para ${producto.nombre}`);
      } else {
        console.error(`❌ Error al subir imagen ${i + 1}:`, result);
      }
    } catch (err) {
      console.error(`⚠️ Falló imagen ${i + 1}:`, err.message);
    }
  }
};

