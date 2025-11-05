import { generateDescriptionWithAI, sendToAI } from "../integrations/AIservice.js";
import {
  driveFindImageBySKU,
  getDriveFileName,
  getURLbySKU,
} from "../integrations/driveService.js";
import getTokenAndStore from "../utils/getTokenAndStore.js";
import { subirImagenesBase64 } from "../utils/imageToBase64.js";
import waitingConfirmation from "../utils/waitingConfirmation.js";
import { getRawProductsFromExcel } from "./excelService.js";
import dotenv from "dotenv";

dotenv.config();

export const getProductBySKU = async (sku, token, store) => {
  const res = await fetch(
    `https://api.tiendanube.com/v1/${store}/products/sku/${sku}`,
    {
      method: "GET",
      headers: {
        Authentication: `bearer ${token}`,
        "User-Agent": "Getting product (ezequiasherrera99@gmail.com)",
        "Content-Type": "application/json",
      }
    }
  );

  return res.json();
};

const uploadProducts = async (product) => {
  const access = getTokenAndStore("KTGASTRO");

  const body = {
    name: { es: product.nombre },
    description: { es: product.descripcion || "" },
    published: false,
    tags: product.tags || "",
    free_shipping: product.envioSinCargo,
    requires_shipping: product.productoFisico,
    brand: product.marca || "",
    variants: [
      {
        price: "100.00" || "0.00",
        stock: product.stock || 0,
        sku: product.sku || "",
        weight: product.peso || "0.00",
        width: product.ancho || "0.00",
        height: product.alto || "0.00",
        depth: product.profundidad || "0.00",
        cost: "100.00" || "0.00",
        stock_management: true,
      },
    ],
    categories: product.categorias || [],
  };

  const res = await fetch(
    `https://api.tiendanube.com/v1/${access.store}/products`,
    {
      method: "POST",
      headers: {
        Authentication: `bearer ${access.token}`,
        "User-Agent": "Excel Uploader (ezequiasherrera99@gmail.com)",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const result = await res.json();

  if (res.ok) {
    console.log(`✅ Producto subido: ${product.nombre}`);
    if (Array.isArray(product.fileIds) && product.fileIds.length > 0) {
      await subirImagenesBase64(product.fileIds, access.token, access.store, {
        ...product,
        id: result.id,
      });
    }
  } else {
    console.error(`❌ Error al subir ${product.nombre}:`, result);
  }
};

const uploadProductsFromExcel = async () => {
  const rawProducts = await getRawProductsFromExcel();

  for (const product of rawProducts) {
    console.log(`\n📦 Preparando producto: ${product.nombre}`);

    const fileIds = (await driveFindImageBySKU(product.sku, true)) || [];
    const descripcionAI = await generateDescriptionWithAI(product.descripcionRaw, product.sku);

    const fullProduct = {
      ...product,
      descripcion: descripcionAI || "",
      fileIds,
    };

    // await waitingConfirmation(fullProduct);
    await uploadProducts(fullProduct);
  }
};

const setProductAsVisible = async (product, token, store) => {
  const productId = product.id;
  const sku = product.variants?.[0]?.sku;

  if (skuBuscados.some((skuObjetivo) => skuObjetivo === sku)) {
    try {
      const response = await fetch(
        `https://api.tiendanube.com/v1/${store}/products/${productId}`,
        {
          method: "PUT",
          headers: {
            Authentication: `bearer ${token}`,
            "User-Agent": "Visibility updater (ezequiasherrera99@gmail.com)",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            published: true,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log(
          `✅ Producto ${productId} ahora está visible en la tienda.`
        );
      } else {
        console.warn(
          `⚠️ No se pudo actualizar visibilidad para ${productId}:`,
          result
        );
      }
    } catch (err) {
      console.error(
        `❌ Error al cambiar visibilidad del producto ${productId}:`,
        err.message
      );
    }
  }
};

const setWhatsappButtonOnProducts = async (
  product,
  productosMap,
  token,
  store
) => {

  const productId = product.id;
  const sku = product.variants?.[0]?.sku;

  if (skuBuscados.includes(sku)) {
    const producto = productosMap[sku];

    if (!producto) {
      console.warn(`⚠️ SKU ${sku} no encontrado en productos.json`);
      return;
    }

    try {
      for (const variant of product.variants) {
        const variantId = variant.id;

        const variantResponse = await fetch(
          `https://api.tiendanube.com/v1/${store}/products/${productId}/variants/${variantId}`,
          {
            method: "PUT",
            headers: {
              Authentication: `bearer ${token}`,
              "User-Agent": "Visibility updater (ezequiasherrera99@gmail.com)",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              price: producto.precio,
              compare_at_price: "",
              promotional_price: "",
            }),
          }
        );

        const variantResult = await variantResponse.json();

        if (variantResponse.ok) {
          console.log(
            `✅ Variante ${variant.sku} actualizada con precio ${producto.precio}.`
          );
        } else {
          console.warn(
            `⚠️ No se pudo actualizar variante ${variantId}:`,
            variantResult
          );
        }
      }
    } catch (err) {
      console.error(`❌ Error al procesar producto ${productId}:`, err.message);
    }
  }
};

export {
  uploadProductsFromExcel,
  setProductAsVisible,
  setWhatsappButtonOnProducts,
};