import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const code = process.env.TOKEN_KT_HOGAR;

const params = new URLSearchParams();
params.append('client_id', clientId);
params.append('client_secret', clientSecret);
params.append('code', code);
params.append('grant_type', 'authorization_code');

fetch('https://www.tiendanube.com/apps/authorize/token', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    },
    body: params
})
    .then(res => res.json())
    .then(data => {
        console.log(data);
    })
    .catch(err => console.error('❌ Error:', err));