import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

export const MAGENTO_BASE_URL = process.env.MAGENTO_BASE_URL || '';
export const MAGENTO_API_TOKEN = process.env.MAGENTO_API_TOKEN || '';

export const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'
});