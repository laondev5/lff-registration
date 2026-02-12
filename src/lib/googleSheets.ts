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

    // Generate a simple unique ID
    const uniqueId = `LFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    // Columns:
    // A: UniqueId
    // B: Full Name
    // C: Email
    // D: Phone Number
    // E: WhatsApp
    // F: Gender
    // G: LFF Member
    // H: Church Details
    // I: Area/District
    // J: State
    // K: Country
    // L: Attendance Type
    // M: Bus Interest
    // N: Meal Collection
    // O: Prayer Request
    // P: Accommodation Required
    // Q: Accommodation Type
    // R: Price
    // S: Duration
    // T: Payment Proof Link
    // U: Department Status
    // V: Department
    // W: SubDepartment
    // X: Timestamp

    const row = [
        uniqueId,
        data.fullName || '',
        data.email || '',
        data.phoneNumber || '',
        data.whatsapp || '',
        data.gender || '',
        data.isLFFMember || '',
        data.churchDetails || '',
        data.areaDistrict || '',
        data.state || '',
        data.country || '',
        data.attendanceType || '',
        data.busInterest || '',
        data.mealCollection || '',
        data.prayerRequest || '',
        data.needsAccommodation ? 'Yes' : 'No',
        '',   // Accommodation Type (updated later if they book)
        '',   // Price
        '',   // Duration
        '',   // Payment Proof Link
        '',   // Department Status (New / Member / Just Member)
        '',   // Department
        '',   // SubDepartment
        timestamp
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:X',
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

    // Find the row with the uniqueId
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:A',
    });

    const rows = response.data.values;
    let rowIndex = -1;

    if (rows) {
        rowIndex = rows.findIndex(row => row[0] === uniqueId);
    }

    if (rowIndex === -1) {
        throw new Error("User not found via Unique ID");
    }

    const actualRow = rowIndex + 1;

    // Update Columns Q(17), R(18), S(19) (Accommodation info)
    // Remember columns are 1-based in range strings but 0-based in array index
    // A=1 ... P=16, Q=17, R=18, S=19
    const updateRow = [
        accommodationData.type,
        accommodationData.price,
        accommodationData.duration || ''
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!Q${actualRow}:S${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [updateRow]
        }
    });

    return true;
}

export async function updatePaymentProof(uniqueId: string, fileLink: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const sheets = await getSheetsClient();

    // Find the row with the uniqueId
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:A',
    });

    const rows = response.data.values;
    let rowIndex = -1;

    if (rows) {
        rowIndex = rows.findIndex(row => row[0] === uniqueId);
    }

    if (rowIndex === -1) {
        throw new Error("User not found via Unique ID");
    }

    const actualRow = rowIndex + 1;

    // Update Column T (Payment Proof Link) - T is the 20th letter
    const updateRow = [fileLink];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!T${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [updateRow]
        }
    });

    return true;
}

export async function updateUserDepartment(uniqueId: string, deptData: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const sheets = await getSheetsClient();

    // Find the row with the uniqueId
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:A',
    });

    const rows = response.data.values;
    let rowIndex = -1;

    if (rows) {
        rowIndex = rows.findIndex(row => row[0] === uniqueId);
    }

    if (rowIndex === -1) {
        throw new Error("User not found via Unique ID");
    }

    const actualRow = rowIndex + 1;

    // Update Columns U, V, W
    const updateRow = [
        deptData.status,
        deptData.department || '',
        deptData.subDepartment || ''
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!U${actualRow}:W${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [updateRow]
        }
    });

    return true;
}

export async function getUserById(uniqueId: string) {
    const users = await getUsers();
    return users.find(u => u.uniqueId === uniqueId);
}

// --- Department Functions ---

export async function getDepartments() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    // Sheet: 'Departments'
    // Columns: A: Id, B: Name, C: SubDepartments (JSON)
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Departments!A:C',
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows.map((row, index) => ({
            id: row[0],
            name: row[1],
            subDepartments: row[2] ? JSON.parse(row[2]) : [],
            rowIndex: index + 1
        })).filter(d => d.id !== 'ID');
    } catch (error) {
        console.warn("Departments sheet might not exist yet.", error);
        return [];
    }
}

export async function addDepartment(name: string, subDepartments: string[]) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const uniqueId = `DEPT-${Date.now()}`;
    const row = [
        uniqueId,
        name,
        JSON.stringify(subDepartments)
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Departments!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row]
        }
    });

    return uniqueId;
}

export async function updateDepartment(id: string, name: string, subDepartments: string[]) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const departments = await getDepartments();
    const target = departments.find(d => d.id === id);
    if (!target) throw new Error("Department not found");

    const rowIndex = target.rowIndex;

    const row = [name, JSON.stringify(subDepartments)];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Departments!B${rowIndex}:C${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row]
        }
    });

    return true;
}

// --- Admin Functions ---

export async function getUsers() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:X',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // Map rows to objects for easier consumption
    // Columns mapping from appendRegistration:
    // 0: UniqueId, 1: Name, 2: Email, 3: Phone, 4: WhatsApp, 5: Gender, 6: LFF Member, 7: Church,
    // 8: Area, 9: State, 10: Country, 11: Attendance, 12: Bus, 13: Meal, 14: Prayer,
    // 15: AccRequired, 16: AccType, 17: Price, 18: Duration, 19: PaymentProof,
    // 20: DeptStatus, 21: Department, 22: SubDept, 23: Timestamp

    return rows.map((row, index) => ({
        rowIndex: index + 1, // 1-based index for potential updates
        uniqueId: row[0],
        fullName: row[1],
        email: row[2],
        phoneNumber: row[3],
        whatsapp: row[4],
        gender: row[5],
        isLFFMember: row[6],
        churchDetails: row[7],
        areaDistrict: row[8],
        state: row[9],
        country: row[10],
        attendanceType: row[11],
        busInterest: row[12],
        mealCollection: row[13],
        prayerRequest: row[14],
        needsAccommodation: row[15],
        accommodationType: row[16],
        price: row[17],
        duration: row[18],
        paymentProof: row[19],
        departmentStatus: row[20],
        department: row[21],
        subDepartment: row[22],
        timestamp: row[23]
    }));
}

export async function getAccommodations() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    // Sheet: 'Accommodations'
    // Columns: A: Id, B: Title, C: Description, D: Price, E: ImageUrl, F: Slots, G: CreatedAt, H: FileId
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Accommodations!A:H',
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows.map((row, index) => ({
            id: row[0],
            title: row[1],
            description: row[2],
            price: row[3],
            imageUrl: row[4],
            slots: row[5],
            createdAt: row[6],
            fileId: row[7],
            rowIndex: index + 1
        })).filter(acc => acc.id !== 'ID'); // Filter out header if present
    } catch (error) {
        console.warn("Accommodations sheet might not exist yet or is empty.", error);
        return [];
    }
}

export async function addAccommodation(data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const uniqueId = `ACC-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const row = [
        uniqueId,
        data.title,
        data.description,
        data.price,
        data.imageUrl,
        data.slots || '0',
        timestamp,
        data.fileId || ''
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Accommodations!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row]
        }
    });

    return uniqueId;
}

export async function updateAccommodationListing(id: string, data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const accommodations = await getAccommodations();
    const target = accommodations.find(acc => acc.id === id);

    if (!target) throw new Error("Accommodation not found");

    const rowIndex = target.rowIndex;

    const updateRow = [
        data.title || target.title,
        data.description || target.description,
        data.price || target.price,
        data.imageUrl || target.imageUrl,
        data.slots || target.slots,
        target.createdAt, // Keep original creation date
        data.fileId || target.fileId
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Accommodations!B${rowIndex}:H${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [updateRow]
        }
    });

    return true;
}

export async function deleteAccommodationListing(id: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const accommodations = await getAccommodations();
    const target = accommodations.find(acc => acc.id === id);

    if (!target) throw new Error("Accommodation not found");

    const rowIndex = target.rowIndex;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: await getSheetId(sheets, spreadsheetId, 'Accommodations'),
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }
            ]
        }
    });

    return true;
}

async function getSheetId(sheets: any, spreadsheetId: string, sheetName: string) {
    const response = await sheets.spreadsheets.get({
        spreadsheetId
    });

    const sheet = response.data.sheets.find((s: any) => s.properties.title === sheetName);
    return sheet ? sheet.properties.sheetId : 0;
}
