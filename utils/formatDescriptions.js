import getTokenAndStore from "./getTokenAndStore.js";
import doInEveryProduct from "./doInEveryProduct.js";

//FUNCION PARA CADA PRODUCTO (YA SE USÓ)
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
const removeComments = (html) => {
    return html.replace(/<!--[\s\S]*?-->/g, "");
};
const removeHtmlTags = (html) => {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};
const removeStyleTags = (html) => {
    return html.replace(/<style[\s\S]*?<\/style>/gi, "");
};
const detectCase = (descripcion) => {
    const inicio = descripcion.trim().slice(0, 20).toLowerCase();

    if (inicio.startsWith("<p>&nbsp;</p>")) return "caso1";
    if (inicio.startsWith("<table")) return "caso2";
    if (inicio.startsWith("<meta")) return "caso3";
    if (inicio.startsWith("<!-- [if")) return "caso4";
    return "otro";
};
const cleanDescriptionFromHTML = (description, actionCase, cases) => {
    switch (actionCase) {
        case "caso1":
            cases.case1++;
            return removeHtmlTags(description); // retorno texto sin HTML
        case "caso2":
            cases.case2++;
            return removeHtmlTags(description); // retorno texto sin HTML
        case "caso3": {
            cases.case3++;
            return removeHtmlTags(description); // retorno texto sin HTML
        }
        case "caso4":
            cases.case4++;
            const descriptionWithoutComments = removeComments(description)
            return removeHtmlTags(descriptionWithoutComments);
        default:
            cases.other.number++;
            const primeros5 = description.trim().slice(0, 5);

            if (!cases.other.firstChars.includes(primeros5)) {
                cases.other.firstChars.push(primeros5);
            }

            return description; // no tocar o desconocido
    }
};
const normalizeDescription = async (product, token, store, cases) => {

    //OBTENGO LA DESCRIPCIÓN
    const description = product?.description?.es || "";

    //QUITO LOS COMENTARIOS: <!-- -->
    const descriptionNoComments = removeComments(description);
    //QUITO EL STYLES SI ES QUE TIENE: <style </style
    const descriptionNoStyle = removeStyleTags(descriptionNoComments);
    //QUITO LOS TAGS DE HTML:
    const actionCase = detectCase(description);
    const descripcionLimpia = cleanDescriptionFromHTML(descriptionNoStyle, actionCase, cases);

    if (actionCase != "otro") {
        const prompt = `Necesito la info del producto ${product.name?.es} organizada en items <li> para volcar en mi web y que quede ordenada y tipo texto plano html <ul>. Ignora emojis y todas las etiquetas HTML que no tengan relación con el producto. Unicamente mandame lo que necesito asi copio y pego, no interactues conmigo. Si la info que te copio tiene un encabezado del titulo del producto, reemplaza ese encabezado por la palabra Caracteristicas Principales dentro de la etiqueta <strong> y este debe estar encima y fuera de la etiqueta <ul>. Nunca menciones el nombre del producto: ${descripcionLimpia}`;

        try {
            const result = await sendToAI(prompt);
            const newDescription = result.candidates?.[0]?.content?.parts?.[0]?.text;

            console.log(`${product.name?.es} ${product.variants?.[0]?.sku}`)
            console.log("\n🧠 Texto generado:\n", newDescription);

            const url = `https://api.tiendanube.com/v1/${store}/products/${product.id}`;
            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    Authentication: `bearer ${token}`,
                    "User-Agent": "Descriptions normalization (ezequiasherrera99@gmail.com)",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ description: newDescription }),
            });

            if (res.ok) {
                console.log(`✅ Descripción actualizada para producto ${product.id}`);
            } else {
                console.warn(`❌ Error al actualizar producto ${product.id}: ${res.statusText}`);
            }
        } catch (error) {
            console.error("❌ Error al generar o subir la descripción:", error);
        }
    }
}
const updateDescriptionsWithCasesAndAI = async (targetStore) => {
    const access = getTokenAndStore(targetStore);
    const cases = { case1: 0, case2: 0, case3: 0, case4: 0, other: { number: 0, firstChars: [] } };

    await doInEveryProduct(
        (product) => normalizeDescription(product, access.token, access.store, cases),
        access.token,
        access.store
    );

    console.log("\n📊 Resumen de casos:");
    console.log("Caso 1:", cases.case1);
    console.log("Caso 2:", cases.case2);
    console.log("Caso 3:", cases.case3);
    console.log("Caso 4:", cases.case4);
    console.log("Otros/Ignorados:", cases.other);

    if (cases.other.firstChars.length > 0) {
        console.log("\n🔍 Primeros 5 caracteres de los ignorados:");
        cases.other.firstChars.forEach((chars, index) => {
            console.log(`${index + 1}. "${chars}"`);
        });
    } else {
        console.log("\n✅ No hubo casos ignorados.");
    }

}
//FUNCION PRINCIPAL DE DONDE COMIENZA
export const updateDescriptionWithAI = async (skuBuscado, targetStore) => {
    const access = getTokenAndStore(targetStore);

    await doInEveryProduct(
        (product) => updateDescription(product, skuBuscado, access.token, access.store),
        token,
        store
    );
};

export default { updateDescriptionsWithCasesAndAI, updateDescription, removeComments, removeHtmlTags, removeStyleTags, detectCase, cleanDescriptionFromHTML, normalizeDescription }