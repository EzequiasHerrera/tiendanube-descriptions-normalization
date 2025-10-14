import { sendToAI } from "../integrations/AIservice.js";
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

// 🔍 Revisa un producto por SKU
const isThisProductBySKU = (product, skuBuscado) => {
  if (product.variants?.[0]?.sku === skuBuscado) {
    console.log("✅ Producto encontrado:", product);
    return true;
  } else return false;
};

// 🔍 Devuelve un producto por SKU
const findProductBySKU = async (skuBuscado, token, store) => {
  let productoEncontrado = null;

  await doInEveryProduct(
    (product) => {
      if (product.variants?.[0]?.sku === skuBuscado) {
        productoEncontrado = product;
      }
    },
    token,
    store
  );

  return productoEncontrado;
};

const formatDescriptionWithAI = async (descriptionRaw) => {
  const prompt = `Necesito la info del producto organizada en items <li> para volcar en mi web y que quede ordenada y tipo texto plano html donde cada <li> está dentro del <ul> padre. Reemplaza caracteres especiales � por la letra que iría según su contexto. Unicamente mandame lo que necesito asi copio y pego, no interactues conmigo.Colocale de encabezado Caracteristicas Principales dentro de la etiqueta <strong> y este debe estar encima y fuera de la etiqueta <ul>. Nunca menciones el nombre del producto: ${descriptionRaw}`;

  try {
    const result = await sendToAI(prompt);
    const newDescription = result.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("\n🧠 Descripcion generada:\n", newDescription);

    return newDescription;
  } catch (error) {
    console.error("❌ Error al generar o subir la descripción:", error);
  }
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

  const res = await fetch(`https://api.tiendanube.com/v1/6600821/products`, {
    method: "POST",
    headers: {
      Authentication: `bearer 3e9934c4e6df3ad67c0b45e65ee7622bafef9aee`,
      "User-Agent": "Excel Uploader (ezequiasherrera99@gmail.com)",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

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
    const descripcionAI = await formatDescriptionWithAI(product.descripcionRaw);

    const fullProduct = {
      ...product,
      descripcion: descripcionAI || "",
      fileIds,
    };
    await uploadProducts(fullProduct);
  }
};

const setProductAsVisible = async (product, token, store) => {
  //Provoletera 1241218
  const skuBuscados = [
    "1271311",
    "1271310",
    "1141759",
    "1210101",
    "1210012",
    "1244710",
    "5001383",
    "1107130",
    "1107131",
    "1107121",
    "1107122",
    "1107123",
    "1107124",
    "1107125",
    "1107126",
    "1107127",
    "1107128",
    "1107129",
    "1135950",
    "1500110",
    "1106365",
    "1106366",
    "1106367",
    "1106370",
    "1106371",
    "1106368",
    "1106369",
  ];

  const productId = product.id;

  const sku = product.variants?.[0]?.sku;

  if (skuBuscados.some((skuObjetivo) => skuObjetivo === sku)) {
    // continuar con la lógica
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
  const skuBuscados = [
    "1141759",
    "1243575",
    "1243573",
    "1243574",
    "1243572",
    "1151768",
    "1151767",
    "1243571",
    "1243570",
    "1243569",
    "1142110",
    "1142103",
    "1142102",
    "1142101",
    "1142100",
    "1142016",
    "1142015",
    "1142014",
    "1142013",
    "1142012",
    "1142011",
    "1142010",
    "1142009",
    "1142008",
    "1142007",
    "1142006",
    "1142005",
    "1142004",
    "1142003",
    "1141999",
    "1141998",
    "1141995",
    "1141994",
    "1141993",
    "1141992",
    "1141991",
    "1141990",
    "1141989",
    "1141983",
    "1141982",
    "1141981",
    "1141980",
    "1141979",
    "1141978",
    "1141977",
    "1141972",
    "1141971",
    "1141970",
    "1141914",
    "1141913",
    "1141837",
    "1141836",
    "1141835",
    "1141823",
    "1141822",
    "1141821",
    "1141820",
    "1141811",
    "1141810",
    "1141806",
    "1141803",
    "1141802",
    "1141801",
    "1141799",
    "1141798",
    "1141796",
    "1141795",
    "1141772",
    "1141771",
    "1141767",
    "1141765",
    "1141764",
    "1141763",
    "1141760",
    "1141703",
    "1141758",
    "1141757",
    "1141734",
    "1141733",
    "1141732",
    "1141731",
    "1141730",
    "1141729",
    "1141728",
    "1141727",
    "1141726",
    "1141725",
    "1141724",
    "1141723",
    "1141722",
    "1141721",
    "1141719",
    "1141715",
    "1141714",
    "1141712",
    "1141711",
    "1141710",
    "1141709",
    "1141708",
    "1141707",
    "1141705",
    "1141704",
    "1141703",
    "1141702",
    "1131706",
    "1131705",
    "1131704",
    "1131703",
  ];

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