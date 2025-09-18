import { access } from "fs";
import { sendToAI } from "../integrations/AIservice.js";
import { driveFindImageBySKU, getDriveFileName } from "../integrations/driveService.js";
import readline from "readline";
import util from "util";
import sharp from "sharp";
import { createReadStream, existsSync } from 'fs';
import fs from "fs/promises";
import path from "path";
import FormData from 'form-data';
import { getRawProductsFromExcel } from "./excelService.js"

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

    await doInEveryProduct((product) => {
        if (product.variants?.[0]?.sku === skuBuscado) {
            productoEncontrado = product;
        }
    }, token, store);

    return productoEncontrado;
};

const formatDescriptionWithAI = async (descriptionRaw) => {
    const prompt = `Necesito la info del producto organizada en items <li> para volcar en mi web y que quede ordenada y tipo texto plano html donde cada <li> está dentro del <ul> padre. Unicamente mandame lo que necesito asi copio y pego, no interactues conmigo.Colocale de encabezado Caracteristicas Principales dentro de la etiqueta <strong> y este debe estar encima y fuera de la etiqueta <ul>. Nunca menciones el nombre del producto: ${descriptionRaw}`;

    try {
        const result = await sendToAI(prompt);
        const newDescription = result.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("\n🧠 Descripcion generada:\n", newDescription);

        return newDescription;
    } catch (error) {
        console.error("❌ Error al generar o subir la descripción:", error);
    }
}

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
            }
        ],
        images: product.imagenes?.slice(0, 9).map((url, index) => ({
            src: url,
            position: index + 1
        })) || [],
        categories: product.categorias || []
    };

    const res = await fetch(`https://api.tiendanube.com/v1/${access.store}/products`, {
        method: 'POST',
        headers: {
            Authentication: `bearer ${access.token}`,
            "User-Agent": "Excel Uploader (ezequiasherrera99@gmail.com)",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    });

    const result = await res.json();

    if (res.ok) {
        console.log(`✅ Producto subido: ${product.nombre}`);
    } else {
        console.error(`❌ Error al subir ${product.nombre}:`, result);
    }
};

const uploadProductsFromExcel = async () => {
    const rawProducts = await getRawProductsFromExcel();

    for (const product of rawProducts) {
        console.log(`\n📦 Preparando producto: ${product.nombre}`);

        const descripcionAI = await formatDescriptionWithAI(product.descripcionRaw);
        const imagenes = await driveFindImageBySKU(product.sku);

        const fullProduct = {
            ...product,
            descripcion: descripcionAI,
            imagenes
        };

        await uploadProducts(fullProduct);
    }
};