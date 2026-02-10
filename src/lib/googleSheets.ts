import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Helper to get authenticated client
async function getSheetsClient() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    // Handle private key newlines correctly
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error("Missing Google Sheets credentials in environment variables.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: SCOPES,
    });

    return google.sheets({ version: 'v4', auth });
}

export async function appendRegistration(data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const sheets = await getSheetsClient();

    // Generate a simple unique ID (e.g., Timestamp + Random)
    const uniqueId = `LFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    const row = [
        uniqueId,
        data.fullName,
        data.email,
        data.phone,
        data.isVolunteer ? 'Yes' : 'No',
        data.department || '',
        'No', // Accommodation Required (Initial)
        '',   // Accommodation Type
        '',   // Price
        '',   // Duration
        timestamp
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:K', // Adjust Sheet name if needed
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row]
        }
    });

    return uniqueId;
}

export async function updateAccommodation(uniqueId: string, accommodationData: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const sheets = await getSheetsClient();

    // 1. Find the row with the uniqueId
    // This is inefficient for large sheets, but simple for this scale.
    // Better approach: Store row number in app state if possible, or use search.
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:A', // Assuming ID is in Column A
    });

    const rows = response.data.values;
    let rowIndex = -1;

    if (rows) {
        rowIndex = rows.findIndex(row => row[0] === uniqueId);
    }

    if (rowIndex === -1) {
        throw new Error("User not found via Unique ID");
    }

    // Row index is 0-based in array, but 1-based in Sheet. And we need to account for header if present.
    // Actually API uses 1-based index for A1 notation. 
    // If headers are in row 1, and data starts in row 2.
    // response.data.values includes headers if we requested A:A.
    // So rowIndex + 1 is the actual row number.

    const actualRow = rowIndex + 1;

    // Update Columns G, H, I, J (Accommodation info)
    // G: Accommodation Required, H: Type, I: Price, J: Duration
    const updateRow = [
        'Yes',
        accommodationData.type,
        accommodationData.price,
        accommodationData.duration || ''
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!G${actualRow}:J${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [updateRow]
        }
    });

    return true;
}
