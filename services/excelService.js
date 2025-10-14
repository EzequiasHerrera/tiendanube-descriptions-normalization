import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import waitingConfirmation from '../utils/waitingConfirmation.js';

const getRawProductsFromExcel = async () => {
    const filePath = path.resolve('./excel/productos.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parsear CSV con papaparse
    const { data } = Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        delimiter: ";" // ajustá si tu CSV usa coma
    });

    const dataRows = data.slice(1); // omitir encabezado
    const products = [];

    for (const row of dataRows) {
        const nombre = row[1]?.trim() || "";

        // Convertir decimales con coma a punto
        const peso = parseFloat(row[5]?.replace(",", ".")?.trim()) || 0;
        const alto = parseFloat(row[6]?.replace(",", ".")?.trim()) || 0;
        const ancho = parseFloat(row[7]?.replace(",", ".")?.trim()) || 0;
        const profundidad = parseFloat(row[8]?.replace(",", ".")?.trim()) || 0;

        const sku = row[10]?.trim() || "";
        const envioSinCargo = row[13]?.trim().toUpperCase() === "SI";
        const descripcionRaw = row[17]?.trim() || "";
        const marca = row[18]?.trim() || "";
        const productoFisico = row[19]?.trim().toUpperCase() === "SI";

        // console.log(`${nombre} peso: ${peso} alto: ${alto} ancho: ${ancho} profundidad: ${profundidad} sku: ${sku} envio: ${envioSinCargo} marca: ${marca} físico: ${productoFisico}`);

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

export { getRawProductsFromExcel };