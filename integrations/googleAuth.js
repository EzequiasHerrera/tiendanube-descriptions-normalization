import { google } from 'googleapis';
import { getOAuthToken } from './redis.js';
import { redisClient } from './redis.js';

const tokenData = await getOAuthToken();

// 🔧 Adaptar formato para googleapis
tokenData.access_token = tokenData.token;
tokenData.expiry_date = new Date(tokenData.expiry).getTime();

export const oauth2Client = new google.auth.OAuth2(
    tokenData.client_id,
    tokenData.client_secret
);

oauth2Client.setCredentials(tokenData);

// 🔄 Guardar automáticamente el nuevo token cuando se refresca
oauth2Client.on('tokens', async (newTokens) => {
    try {
        const updated = {
            ...tokenData,
            ...newTokens,
            expiry: new Date(newTokens.expiry_date).toISOString()
        };

        await redisClient.set('token', JSON.stringify(updated));
        console.log('🔄 Token actualizado y guardado en Redis');
    } catch (err) {
        console.error('❌ Error al guardar el token actualizado:', err.message);
    }
});