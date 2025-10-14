import dotenv from "dotenv";
import { uploadProductsFromExcel } from "./services/productsService.js";
import { doInEveryProduct } from "./utils/doInEveryProduct.js";
import { adjustMarginPictures } from "./utils/cropPictures.js";
dotenv.config();

const skuBuscados = [
    "1107121",
    "1107122",
    "1107123",
    "1107124",
    "1107125",
    "1107126",
    "1107127",
    "1107128",
    "1107129",
];

doInEveryProduct(adjustMarginPictures, "KTHOGAR")

// uploadProductsFromExcel("KTGASTRO");