import { google } from 'googleapis';
import { getOAuthToken } from './redis.js';

const tokenData = await getOAuthToken();

export const oauth2Client = new google.auth.OAuth2(
    tokenData.client_id,
    tokenData.client_secret
);

oauth2Client.setCredentials(tokenData);