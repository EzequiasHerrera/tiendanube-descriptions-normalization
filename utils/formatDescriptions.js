import getTokenAndStore from "./getTokenAndStore.js";
import { doInEveryProduct } from "./doInEveryProduct.js";
import waitingConfirmation from "./waitingConfirmation.js";
import { sendToAI } from "../integrations/AIservice.js";

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

    if (descripcion.includes("rgb(255, 153, 0)")) return "casoRGB";
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
        case "caso4": {
            cases.case4++;
            const descriptionWithoutComments = removeComments(description)
            return removeHtmlTags(descriptionWithoutComments);
        }
        case "casoRGB": {
            cases.caseRGB++;
            const descriptionWithoutComments = removeComments(description)
            return removeHtmlTags(descriptionWithoutComments);
        }
        default:
            cases.other.number++;
            const primeros5 = description.trim().slice(0, 5);

            if (!cases.other.firstChars.includes(primeros5)) {
                cases.other.firstChars.push(primeros5);
            }

            return description; // no tocar o desconocido
    }
};
export const normalizeDescription = async (product, token, store) => {
    const cases = { case1: 0, case2: 0, case3: 0, case4: 0, caseRGB: 0, other: { number: 0, firstChars: [] } };
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
        const prompt = `Necesito la info del producto ${product.name?.es} organizada en items <li> para volcar en mi web y que quede ordenada y tipo texto plano html <ul>. Ignora emojis y todas las etiquetas HTML que no tengan relación con el producto. Unicamente mandame lo que necesito asi copio y pego, no interactues conmigo. Si la info que te copio tiene un encabezado del titulo del producto, reemplaza ese encabezado por la palabra Caracteristicas Principales dentro de la etiqueta <strong> y este debe estar encima y fuera de la etiqueta <ul>. El SKU debe ir en la ultima parte fuera de la lista <ul>, dentro de una etiqueta <p>. Nunca menciones el nombre del producto: ${descripcionLimpia}`;

        try {
            const result = await sendToAI(prompt);
            const newDescription = result.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`${product.name?.es} ${product.variants?.[0]?.sku}`)
            console.log("\n🧠 Texto generado:\n", newDescription);
            // await waitingConfirmation();

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

const addSkuToDescription = async (product, token, store, skuBuscadosConModelo) => {
    try {
        if (!product) {
            console.warn("❌ No se encontró el producto en la tienda destino");
            return;
        }

        const originalDescription = product.description?.es || "";
        const sku = product.variants?.[0]?.sku || "";
        const newDescription = `${originalDescription}\n<p>SKU: ${sku}</p>`;

        const url = `https://api.tiendanube.com/v1/${store}/products/${product.id}`;
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authentication: `bearer ${token}`,
                "User-Agent": "Adding SKU to description (ezequiasherrera99@gmail.com)",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ description: newDescription }),
        });

        if (res.ok) {
            console.log(`✅ Descripción actualizada para producto SKU ${product.variants?.[0]?.sku}`);
        } else {
            console.warn(`❌ Error al actualizar producto ${product.id}: ${res.statusText}`);
        }
    } catch (error) {
        console.error("❌ Error al generar o subir la descripción:", error);
    }
}
const addModelToDescription = async (product, token, store, skuBuscadosConModelo) => {
    try {
        if (!product) return;

        const sku = product.variants?.[0]?.sku || "";
        const modelo = skuBuscadosConModelo[sku];
        if (!modelo) return;

        const originalDescription = product.description?.es || "";

        // Evitar duplicar
        if (originalDescription.includes(`Modelo:`) && originalDescription.includes(modelo)) return;

        let newDescription;

        const lastLiIndex = originalDescription.lastIndexOf("</li>");

        if (lastLiIndex !== -1) {
            // Insertar modelo justo después del último </li>
            newDescription =
                originalDescription.slice(0, lastLiIndex + 5) +
                `<li><strong>Modelo:</strong> ${modelo}</li>` +
                originalDescription.slice(lastLiIndex + 5);
        } else {
            // Si no hay <li>, agregamos al final como lista nueva
            newDescription = `${originalDescription}\n<ul><li><strong>Modelo:</strong> ${modelo}</li></ul>`;
        }

        console.log(`✅ Modelo agregado para SKU ${sku}: ${modelo}`);
        console.log(newDescription);

        const url = `https://api.tiendanube.com/v1/${store}/products/${product.id}`;
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authentication: `bearer ${token}`,
                "User-Agent": "Adding modelo to description (ezequiasherrera99@gmail.com)",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ description: { es: newDescription } }),
        });

        if (res.ok) {
            console.log(`✅ Descripción actualizada para producto con SKU ${sku} (Modelo: ${modelo})`);
        } else {
            console.warn(`❌ Error al actualizar producto ${product.id}: ${res.statusText}`);
        }
    } catch (error) {
        console.error("❌ Error al generar o subir la descripción:", error);
    }
};

//FUNCION PRINCIPAL DE DONDE COMIENZA
export const descriptionModificationCore = async () => {
    const access = await getTokenAndStore("KTGASTRO");

    const skuBuscadosConModelo = {
    }

    await doInEveryProduct(
        (product) => addSkuToDescription(product, access.token, access.store),
        access.token,
        access.store
    );
};

export default { updateDescription, removeComments, removeHtmlTags, removeStyleTags, detectCase, cleanDescriptionFromHTML }