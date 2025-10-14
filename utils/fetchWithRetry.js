export const fetchWithRetry = async (url, options, maxRetries = 5, delay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, options);

        if (res.status !== 429) return res;

        console.warn(`⏳ Esperando por límite de velocidad (429). Reintento ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }

    throw new Error("❌ Se excedió el límite de reintentos por error 429");
};