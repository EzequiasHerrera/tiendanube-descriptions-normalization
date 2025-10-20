import getTokenAndStore from "./getTokenAndStore.js";

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

export const doInEveryProduct = async (action, storeName, skuBuscados = [], perPage = 200) => {
    const access = getTokenAndStore(storeName);
    let page = 1;
    let totalProductos = 0;

    while (true) {
        const products = await fetchAllProductsInPage(page, access.token, access.store, perPage);
        if (!products || products.length === 0) break;
        // ♾️ Procesar todos en paralelo
        // await Promise.all(products.map(action));

        for (const product of products) {
            const skuActual = product.variants?.[0]?.sku;

            if (skuBuscados.length > 0 && !skuBuscados.includes(skuActual)) {
                continue;
            }

            await action(product, access.token, access.store);
        }

        totalProductos += products.length;
        page++;
    }
};

export { fetchAllProductsInPage };