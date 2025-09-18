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