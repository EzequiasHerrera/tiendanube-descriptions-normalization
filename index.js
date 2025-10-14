import dotenv from "dotenv";
import { doInEveryProduct } from "./utils/doInEveryProduct.js";
import { adjustMarginPictures } from "./utils/cropPictures.js";
import { uploadProductsFromExcel } from "./services/productsService.js";
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

// doInEveryProduct(adjustMarginPictures, "KTGASTRO")

uploadProductsFromExcel("KTGASTRO");