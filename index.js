import dotenv from "dotenv";
import { cropPicturesFromTiendaNube } from "./utils/cropPictures.js";
import { uploadProductsFromExcel } from "./services/productsService.js"

dotenv.config();

// const newProduct = {
//   id: product.id,
//   name: product.name?.es,
//   sku: product.variants?.[0]?.sku,
//   description: product.description?.es,
// };

cropPicturesFromTiendaNube();