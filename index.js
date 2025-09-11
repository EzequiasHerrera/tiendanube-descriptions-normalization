import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { sendToAI } from "./services/AIservice.js";
import { updateDescriptionWithAI } from './services/productsService.js';

dotenv.config();

const listaDeSKUs = [
  "1142104", "1141752", "1141744", "1142004", "1142003",
  "1141999", "1141998", "1141983", "1141980", "1141979", "1141992", "1141991", "1141990",
  "1141989", "1141972", "1141971", "1141970", "1142110", "1142103", "1142102", "1142101",
  "1142100", "1141977", "1141796", "1243557", "1243549", "1141837", "1141836", "1141835",
  "1141799", "1141734", "1141733", "1141732", "1141811", "1141810", "1141795", "1141772",
  "1141771", "1141719", "1141714", "1141712", "1141710", "1141709", "1141705", "1141978",
  "1141763", "1143012", "1143011", "1143010", "1143008", "1143006", "1143004", "1143002",
  "1143000", "1141995", "1141708", "1141702", "1151951", "1151950", "1141850", "1141888",
  "1141852", "1141851", "1141746", "1141878", "1141826", "1141825", "1141762", "1141761",
  "1141756", "1141755", "1141754", "1141769", "1141768", "1141743", "1141747", "1141736",
  "1141701", "1141745", "1141828", "1141827", "1141823", "1141806", "1141805", "1141803",
  "1141742", "1141735", "1141731", "1141730", "1141724", "1141723", "1141722", "1141721",
  "1141790", "1141789", "1141788", "1141787", "1141786", "1141785", "1141784", "1141783",
  "1141782", "1141781", "1141780", "1141779", "1141778", "1141777", "1141776", "1141775",
  "1141774", "1141773"
];

//Funcion que recibe un producto, detecta si tiene emojis y lo guarda en la lista productosConEmojis
const getProductsWithEmojis = async (product) => {
  const description = product?.description?.es || ""; // Asumiendo que usás español
  const hasEmojis = emojiRegex.test(description);

  if (hasEmojis) {
    console.log(
      `🟡 Producto con emojis: ${product.name?.es} (ID: ${product.id})`
    );

    const newProduct = {
      id: product.id,
      name: product.name?.es,
      sku: product.variants?.[0]?.sku,
      description: product.description?.es,
    };

    productosConEmojis.push(newProduct);
  }
};

const guardarLista = () => {
  const ruta = path.resolve("./productos_con_emojis.json");
  fs.writeFileSync(ruta, JSON.stringify(productosConEmojis, null, 2));
  console.log(
    `✅ Se guardaron ${productosConEmojis.length} productos en el archivo.`
  );
};

const processEverySKU = async () => {
  for (const sku of listaDeSKUs) {
    await updateDescriptionWithAI("KTHOGAR", sku);
    console.log(`\n🏋🏻 Procesando SKU: ${sku}\n`)
  }

  console.log("\n✅ Todos los SKUs fueron procesados.");
}

processEverySKU();