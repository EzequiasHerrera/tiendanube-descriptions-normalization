export const sendToAI = async (prompt, maxRetries = 5, delayMs = 30000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": "AIzaSyD-ESfl-Mgvz6wHmaGNGh9LUq80mZU5GfM",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (res.status === 429) {
      console.warn(`⏳ Intento ${attempt}: demasiadas solicitudes. Esperando ${delayMs / 1000} segundos...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    if (!res.ok) {
      throw new Error(`❌ Error ${res.status}: ${res.statusText}`);
    }

    return await res.json(); // ✅ éxito
  }

  throw new Error("❌ Se excedieron los reintentos por límite de solicitudes.");
};

export const generateDescriptionWithAI = async (descriptionRaw, sku) => {
  const prompt = `Necesito la info del producto organizada en items <li> para volcar en mi web y que quede ordenada y tipo texto plano html donde cada <li> está dentro del <ul> padre. Reemplaza caracteres especiales � por la letra que iría según su contexto. Unicamente mandame lo que necesito asi copio y pego, no interactues conmigo.Colocale de encabezado Caracteristicas Principales dentro de la etiqueta <strong> y este debe estar encima y fuera de la etiqueta <ul>. Agrega <p>SKU: ${sku}</p> fuera de la etiqueta </ul> al final de todo. Nunca menciones el nombre del producto: ${descriptionRaw}`;

  try {
    const result = await sendToAI(prompt);
    const newDescription = result.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("\n🧠 Descripcion generada:\n", newDescription);

    return newDescription;
  } catch (error) {
    console.error("❌ Error al generar o subir la descripción:", error);
  }
};