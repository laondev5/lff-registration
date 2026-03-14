require('dotenv').config({path: '.env.local'});
const key = process.env.GOOGLE_PRIVATE_KEY;
console.log('Exists:', !!key);
console.log('Includes \\\\n:', key.includes('\\n'));
console.log('Replaced Length:', key.replace(/\\n/g, '\n').length);
