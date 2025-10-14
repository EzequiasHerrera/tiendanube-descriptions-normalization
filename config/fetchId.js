import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const clientId = "21040";
const clientSecret = "a77d9f10e3d7d0335a44afc8d33032bb4d9cd0e141302a2b";
const code = "3c84bb85ab4afd6153aa6462bdf46dfbcff4fbd6";

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