import dotenv from "dotenv";
import { doInEveryProduct } from "./utils/doInEveryProduct.js";
import { addSkuToDescription } from "./utils/formatDescriptions.js";
import { uploadProductsFromExcel } from "./services/productsService.js";
import { getURLbySKU } from "./integrations/driveService.js";
import { adjustMarginPictures } from "./utils/cropPictures.js";
dotenv.config();

const skuBuscados = [
	"1278623",
	"1278004",
	"1270190",
	"1135206",
	"1135207",
	"1185177",
	"1185178",
	"1185176",
	"1144431",
	"1144430",
];

doInEveryProduct(adjustMarginPictures, "KTGASTRO", skuBuscados)
// uploadProductsFromExcel("KTGASTRO");

// getURLbySKU("1144430").then((res) => {
// 	console.log(res);
// });
