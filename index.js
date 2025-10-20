import dotenv from "dotenv";
import { doInEveryProduct } from "./utils/doInEveryProduct.js";
import { addSkuToDescription } from "./utils/formatDescriptions.js";
dotenv.config();

const skuBuscados = [
    "1063640",
    "1141896",
    "1141897",
    "1141898",
    "1141899"
];

doInEveryProduct(addSkuToDescription, "KTGASTRO", skuBuscados)

// uploadProductsFromExcel("KTGASTRO");