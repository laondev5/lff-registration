require('dotenv').config({path: '.env.local'});
const { google } = require('googleapis');

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
if (privateKey) {
  privateKey = privateKey.replace(/^"|"$/g, '');
  privateKey = privateKey.replace(/\\n/g, '\n');
}

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
     const sheets = google.sheets({ version: 'v4', auth });
     const res = await sheets.spreadsheets.values.get({
         spreadsheetId: process.env.GOOGLE_SHEET_ID,
         range: 'Accommodations!A:H',
     });
     console.log('Got response. Rows length:', res.data.values ? res.data.values.length : 0);
  } catch(e) {
     console.error('Error:', e.message);
  }
}
test();
