import { createClient } from 'redis';

export const redisClient = createClient({
    username: 'admin',
    password: 'KitchenTools2025*',
    socket: {
        host: 'redis-18037.crce181.sa-east-1-2.ec2.redns.redis-cloud.com',
        port: 18037
    }
});

await redisClient.connect();

export async function getOAuthToken() {
    const rawToken = await redisClient.get('token');
    const tokenData = JSON.parse(rawToken);
    tokenData.expiry_date = new Date(tokenData.expiry).getTime();
    return tokenData;
}