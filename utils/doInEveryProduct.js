import getTokenAndStore from "./getTokenAndStore.js";

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

//ORDENADO DESDE LO MÁS GENERAL Y AMPLIO HASTA LO MÁS INDIVIDUAL Y SINGULAR
//🔁 Recorre todos los productos de una tienda
const doInEveryProduct = async (action, storeName, perPage = 200) => {
    const access = await getTokenAndStore(storeName);
    let page = 1;
    let totalProductos = 0; //Para llevar la cuenta total de productos vistos

    while (true) {
        //Obtiene los productos en la pagina actual
        const products = await fetchAllProductsInPage(page, access.token, access.store, perPage);

        //Si no hay productos se corta el proceso
        if (!products || products.length === 0) break;

        // ♾️ Procesar todos en paralelo
        // await Promise.all(products.map(action));

        // 🔢 Procesar uno por uno con confirmación
        for (const product of products) {
            await action(product); // Espera que termine antes de seguir
        }

        totalProductos += products.length;
        page++;
    }
};

export { fetchAllProductsInPage, doInEveryProduct };