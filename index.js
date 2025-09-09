import dotenv from "dotenv";

dotenv.config();

const TOKEN_KT_HOGAR = process.env.TOKEN_KT_HOGAR;
const STORE_ID_KTHOGAR = process.env.STORE_ID_KTHOGAR;
const PER_PAGE = 200;

//Obtiene productos en una pagina específica
const fetchProductsInPage = async (page = 1) => {
    const url = `https://api.tiendanube.com/v1/${STORE_ID_KTHOGAR}/products?per_page=${PER_PAGE}&page=${page}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Authentication": `bearer ${TOKEN_KT_HOGAR}`,
            "User-Agent": "Drive images to products (ezequiasherrera99@gmail.com)",
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        console.warn(`⚠️ Error en página ${page}: ${res.status} ${res.statusText}`);
        return [];
    }

    return res.json();
};

const doInEveryProduct = async (action) => {
    let page = 1;
    let totalProductos = 0; //Para llevar la cuenta total de productos vistos

    while (true) {
        //Obtiene los productos en la pagina actual
        const products = await fetchProductsInPage(page);

        //Si no hay productos se corta el proceso
        if (!products || products.length === 0) break;

        // Subimos todos los productos de esta página en paralelo
        await Promise.all(products.map(action));

        totalProductos += products.length;
        page++;
    }
}

// Defino el Regex de Emoji
const emojiRegex = /[\p{Emoji}]/gu;
const getProductsWithEmojis = async (product) => {
    const description = product?.description?.es || ""; // Asumiendo que usás español
    const hasEmojis = emojiRegex.test(description);

    if (hasEmojis) {
        console.log(`🟡 Producto con emojis: ${product.name?.es} (ID: ${product.id})`);
    }
};

doInEveryProduct(getProductsWithEmojis)