import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { sendToAI } from '../integrations/AIservice.js';



const getRawProductsFromExcel = async () => {
    const filePath = path.resolve('./excel/productos.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const workbook = XLSX.read(fileContent, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const dataRows = rows.slice(1);

    const products = [];

    for (const row of dataRows) {
        const nombre = row[1]?.toString().trim() || "";
        const peso = row[11]?.toString().trim() || "";
        const alto = row[12]?.toString().trim() || "";
        const ancho = row[13]?.toString().trim() || "";
        const profundidad = row[14]?.toString().trim() || "";
        const sku = row[16]?.toString().trim() || "";
        const envioSinCargo = row[19]?.toString().trim().toUpperCase() === "SI";
        const descripcionRaw = row[20]?.toString().trim() || "";
        const marca = row[24]?.toString().trim() || "";
        const productoFisico = row[25]?.toString().trim().toUpperCase() === "SI";

        products.push({
            nombre,
            peso,
            alto,
            ancho,
            profundidad,
            sku,
            envioSinCargo,
            descripcionRaw,
            marca,
            productoFisico
        });
    }

    return products;
};

export { getRawProductsFromExcel }