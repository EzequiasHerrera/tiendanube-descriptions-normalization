import { sendToAI } from "./AIservice.js";
import readline from "readline";
import util from "util";

const esperarConfirmacion = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("🛑 Presioná Enter para continuar con la subida...\n", () => {
            rl.close();
            resolve();
        });
    });
};

//ORDENADO DESDE LO MÁS GENERAL Y AMPLIO HASTA LO MÁS INDIVIDUAL Y SINGULAR
//🔁 Recorre todos los productos de una tienda
const doInEveryProduct = async (action, token, store, perPage = 200) => {
    let page = 1;
    let totalProductos = 0; //Para llevar la cuenta total de productos vistos

    while (true) {
        //Obtiene los productos en la pagina actual
        const products = await fetchAllProductsInPage(page, token, store, perPage);

        //Si no hay productos se corta el proceso
        if (!products || products.length === 0) break;

        // Subimos todos los productos de esta página en paralelo
        await Promise.all(products.map(action));

        totalProductos += products.length;
        page++;
    }
};

// 📦 Obtiene productos en una pagina específica
const fetchAllProductsInPage = async (page = 1, token, store, perpage) => {
    const url = `https://api.tiendanube.com/v1/${store}/products?per_page=${perpage}&page=${page}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Authentication: `bearer ${token}`,
            "User-Agent": "Descriptions Normalization (ezequiasherrera99@gmail.com)",
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        console.warn(`⚠️ Error en página ${page}: ${res.status} ${res.statusText}`);
        return [];
    }

    return res.json();
};

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

const cleanDescription = (html) => {
    return html.replace(/<!-- \[if gte mso 9\]><xml>[\s\S]*-->/, '');
};

//FUNCION PARA CADA PRODUCTO
const updateDescription = async (product, skuBuscado, token, store) => {
    if (isThisProductBySKU(product, skuBuscado)) {
        const descripcionLimpia = cleanDescription(product.description?.es);

        const prompt = `Necesito la info del producto ${product.name?.es} organizada en items <li> para volcar en mi web y que quede ordenada y tipo texto plano html <ul>. Ignora emojis y todas las etiquetas HTML que no tengan relación con el producto. Unicamente mandame lo que necesito asi copio y pego, no interactues conmigo. Si la info que te copio tiene un encabezado del titulo del producto, reemplaza ese encabezado por la palabra Caracteristicas Principales dentro de la etiqueta <strong> y este debe estar encima y fuera de la etiqueta <ul>. Nunca menciones el nombre del producto: ${descripcionLimpia}`;

        console.log(prompt);

        const tokenObjetivo = process.env.TOKEN_KT_GASTRO;
        const storeObjetivo = process.env.STORE_ID_KTGASTRO;

        try {
            const result = await sendToAI(prompt);
            const newDescription = result.candidates?.[0]?.content?.parts?.[0]?.text;

            console.log("\n🧠 Texto generado:\n", newDescription);

            const productoDestino = await findProductBySKU(skuBuscado, tokenObjetivo, storeObjetivo);

            if (!productoDestino) {
                console.warn("❌ No se encontró el producto en la tienda destino");
                return;
            }

            const url = `https://api.tiendanube.com/v1/${storeObjetivo}/products/${productoDestino.id}`;
            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    Authentication: `bearer ${tokenObjetivo}`,
                    "User-Agent": "Descriptions normalization (ezequiasherrera99@gmail.com)",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ description: newDescription }),
            });

            if (res.ok) {
                console.log(`✅ Descripción actualizada para producto ${productoDestino.id}`);
            } else {
                console.warn(`❌ Error al actualizar producto ${productoDestino.id}: ${res.statusText}`);
            }
        } catch (error) {
            console.error("❌ Error al generar o subir la descripción:", error);
        }
    }
};

//FUNCION PRINCIPAL DE DONDE COMIENZA
export const updateDescriptionWithAI = async (shop, skuBuscado) => {
    let token, store;

    if (shop === "KTGASTRO") {
        token = process.env.TOKEN_KT_GASTRO;
        store = process.env.STORE_ID_KTGASTRO;
    } else {
        token = process.env.TOKEN_KT_HOGAR;
        store = process.env.STORE_ID_KTHOGAR;
    }

    await doInEveryProduct(
        (product) => updateDescription(product, skuBuscado, token, store),
        token,
        store
    );
};