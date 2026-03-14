import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
if (privateKey) {
  privateKey = privateKey.replace(/^"|"$/g, '');
  privateKey = privateKey.replace(/\\n/g, '\n');
}

console.log("Key extracted properly?", typeof privateKey === 'string' && privateKey.includes('BEGIN PRIVATE KEY'));

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: clientEmail,
        private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function test() {
  try {
     const client = await auth.getClient();
     console.log('Success! Client authenticated.');
  } catch(e) {
     console.error('Error:', e.message);
  }
}
test();
