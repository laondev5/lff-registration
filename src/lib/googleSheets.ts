import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function safeJsonParse(jsonString: any) {
    if (!jsonString) return [];
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        return [];
    }
}


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

    // Columns:
    // A: UniqueId
    // B: Title
    // C: Full Name
    // D: Email
    // E: Phone Number
    // F: WhatsApp
    // G: Gender
    // H: LFF Member
    // I: Church Details
    // J: Area/District
    // K: State
    // L: Country
    // M: Attendance Type
    // N: Bus Interest
    // O: Meal Collection
    // P: Prayer Request
    // Q: Registration Type
    // R: Registration Amount
    // S: Registration Payment Proof
    // T: Accommodation Required
    // U: Accommodation Type
    // V: Accommodation Price
    // W: Duration
    // X: Accommodation Payment Proof
    // Y: Department Status
    // Z: Department
    // AA: SubDepartment

    const row = [
        uniqueId,
        data.title || '',
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
        data.registrationType || '',
        data.registrationAmount || '',
        '',   // Registration Payment Proof
        data.needsAccommodation ? 'Yes' : 'No',
        '',   // Accommodation Type (updated later if they book)
        '',   // Accommodation Price
        '',   // Duration
        '',   // Accommodation Payment Proof
        '',   // Department Status (New / Member / Just Member)
        '',   // Department
        '',   // SubDepartment
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:AA',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
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

    // Update Columns U, V, W (Accommodation info)
    const updateRow = [
        accommodationData.type,
        accommodationData.price,
        accommodationData.duration || ''
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

export async function updatePaymentProof(uniqueId: string, fileLink: string, type: 'registration' | 'accommodation' = 'accommodation') {
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

    // Column S = Registration Payment Proof, Column X = Accommodation Payment Proof
    const column = type === 'registration' ? 'S' : 'X';

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!${column}${actualRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[fileLink]]
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

    // Update Columns Y, Z, AA
    const updateRow = [
        deptData.status,
        deptData.department || '',
        deptData.subDepartment || ''
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!Y${actualRow}:AA${actualRow}`,
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
            subDepartments: safeJsonParse(row[2]),
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
        range: 'Sheet1!A:AA',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // Columns mapping from appendRegistration:
    // 0: UniqueId, 1: Title, 2: Name, 3: Email, 4: Phone, 5: WhatsApp, 6: Gender,
    // 7: LFF Member, 8: Church, 9: Area, 10: State, 11: Country, 12: Attendance,
    // 13: Bus, 14: Meal, 15: Prayer, 16: RegType, 17: RegAmount, 18: RegPaymentProof,
    // 19: AccRequired, 20: AccType, 21: AccPrice, 22: Duration, 23: AccPaymentProof,
    // 24: DeptStatus, 25: Department, 26: SubDept, 27: Timestamp

    return rows.map((row, index) => ({
        rowIndex: index + 1,
        uniqueId: row[0],
        title: row[1],
        fullName: row[2],
        email: row[3],
        phoneNumber: row[4],
        whatsapp: row[5],
        gender: row[6],
        isLFFMember: row[7],
        churchDetails: row[8],
        areaDistrict: row[9],
        state: row[10],
        country: row[11],
        attendanceType: row[12],
        busInterest: row[13],
        mealCollection: row[14],
        prayerRequest: row[15],
        registrationType: row[16],
        registrationAmount: row[17],
        registrationPaymentProof: row[18],
        needsAccommodation: row[19],
        accommodationType: row[20],
        price: row[21],
        duration: row[22],
        paymentProof: row[23],
        departmentStatus: row[24],
        department: row[25],
        subDepartment: row[26],
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

// --- Store / E-commerce Functions ---

// Products Sheet Columns:
// A: Id, B: Name, C: Description, D: Price, E: Category, F: Images (JSON), G: Stock, H: CreatedAt,
// I: Variants (JSON), J: Colors (JSON), K: Sizes (JSON)

export async function getProducts() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Products!A:K',
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows.map((row, index) => ({
            id: row[0],
            name: row[1],
            description: row[2],
            price: row[3],
            category: row[4],
            images: safeJsonParse(row[5]),
            stock: row[6],
            createdAt: row[7],
            variants: safeJsonParse(row[8]),
            colors: safeJsonParse(row[9]),
            sizes: safeJsonParse(row[10]),
            rowIndex: index + 1
        })).filter(p => p.id !== 'ID');
    } catch (error) {
        console.warn("Products sheet might not exist yet.", error);
        return [];
    }
}

export async function addProduct(data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const uniqueId = `PROD-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const row = [
        uniqueId,
        data.name,
        data.description,
        data.price,
        data.category,
        JSON.stringify(data.images || []),
        data.stock || '0',
        timestamp,
        JSON.stringify(data.variants || []),
        JSON.stringify(data.colors || []),
        JSON.stringify(data.sizes || [])
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Products!A:K',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row]
        }
    });

    return uniqueId;
}

export async function updateProduct(id: string, data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const products = await getProducts();
    const target = products.find(p => p.id === id);
    if (!target) throw new Error("Product not found");

    const rowIndex = target.rowIndex;

    const row = [
        data.name || target.name,
        data.description || target.description,
        data.price || target.price,
        data.category || target.category,
        data.images ? JSON.stringify(data.images) : JSON.stringify(target.images),
        data.stock || target.stock,
        target.createdAt,
        data.variants !== undefined ? JSON.stringify(data.variants) : JSON.stringify(target.variants || []),
        data.colors !== undefined ? JSON.stringify(data.colors) : JSON.stringify(target.colors || []),
        data.sizes !== undefined ? JSON.stringify(data.sizes) : JSON.stringify(target.sizes || [])
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Products!B${rowIndex}:K${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row]
        }
    });

    return true;
}

export async function deleteProduct(id: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const products = await getProducts();
    const target = products.find(p => p.id === id);
    if (!target) throw new Error("Product not found");

    const rowIndex = target.rowIndex;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: await getSheetId(sheets, spreadsheetId, 'Products'),
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

// Orders Sheet Columns:
// A: Id, B: UserId (or "GUEST"), C: Items (JSON - compact with variants), D: Total, E: Status,
// F: CreatedAt, G: Name, H: Email, I: Phone, J: Items Summary (human-readable with variants)

export async function getOrders() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Orders!A:J',
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows.map((row, index) => ({
            id: row[0],
            userId: row[1],
            items: safeJsonParse(row[2]),
            total: row[3],
            status: row[4],
            createdAt: row[5],
            customerName: row[6] || '',
            customerEmail: row[7] || '',
            customerPhone: row[8] || '',
            itemsSummary: row[9] || '',
            rowIndex: index + 1
        })).filter(o => o.id !== 'ID');
    } catch (error) {
        console.warn("Orders sheet might not exist yet.", error);
        return [];
    }
}

function formatItemsSummary(items: any[]): string {
    return items.map((item: any) => {
        const name = item.product?.name || item.name || 'Unknown';
        const qty = item.quantity || 1;
        const color = item.selectedColor || '';
        const size = item.selectedSize || '';
        const variant = [color, size].filter(Boolean).join(' / ');
        const variantStr = variant ? ` (${variant})` : '';
        return `${qty}x ${name}${variantStr}`;
    }).join('\n');
}

function compactOrderItems(items: any[]): any[] {
    return items.map((item: any) => ({
        productId: item.product?.id || item.productId || '',
        name: item.product?.name || item.name || '',
        price: item.product?.price || item.price || '',
        quantity: item.quantity || 1,
        selectedColor: item.selectedColor || '',
        selectedSize: item.selectedSize || '',
    }));
}

export async function createOrder(data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const uniqueId = `ORD-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const compactItems = compactOrderItems(data.items);
    const itemsSummary = formatItemsSummary(data.items);

    const row = [
        uniqueId,
        data.userId || 'GUEST',
        JSON.stringify(compactItems),
        data.total,
        'Pending',
        timestamp,
        data.customerName || '',
        data.customerEmail || '',
        data.customerPhone || '',
        itemsSummary
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Orders!A:J',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values: [row]
        }
    });

    return uniqueId;
}

export async function updateOrderStatus(id: string, status: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const orders = await getOrders();
    const target = orders.find(o => o.id === id);
    if (!target) throw new Error("Order not found");

    const rowIndex = target.rowIndex;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Orders!E${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[status]]
        }
    });

    return true;
}

// --- Payment Accounts Functions ---
// PaymentAccounts Sheet Columns:
// A: Id, B: AccountName, C: AccountNumber, D: BankName, E: Type (store|accommodation), F: CreatedAt

export async function getPaymentAccounts() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PaymentAccounts!A:F',
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows.map((row, index) => ({
            id: row[0],
            accountName: row[1],
            accountNumber: row[2],
            bankName: row[3],
            type: row[4],
            createdAt: row[5],
            rowIndex: index + 1
        })).filter(a => a.id !== 'ID');
    } catch (error) {
        console.warn("PaymentAccounts sheet might not exist yet.", error);
        return [];
    }
}

export async function addPaymentAccount(data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const uniqueId = `PA-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const row = [
        uniqueId,
        data.accountName,
        data.accountNumber,
        data.bankName,
        data.type, // 'store' or 'accommodation'
        timestamp
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'PaymentAccounts!A:F',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values: [row]
        }
    });

    return uniqueId;
}

export async function updatePaymentAccount(id: string, data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const accounts = await getPaymentAccounts();
    const target = accounts.find(a => a.id === id);
    if (!target) throw new Error("Payment account not found");

    const rowIndex = target.rowIndex;

    const row = [
        data.accountName || target.accountName,
        data.accountNumber || target.accountNumber,
        data.bankName || target.bankName,
        data.type || target.type,
        target.createdAt
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `PaymentAccounts!B${rowIndex}:F${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [row]
        }
    });

    return true;
}

export async function deletePaymentAccount(id: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const accounts = await getPaymentAccounts();
    const target = accounts.find(a => a.id === id);
    if (!target) throw new Error("Payment account not found");

    const rowIndex = target.rowIndex;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: await getSheetId(sheets, spreadsheetId, 'PaymentAccounts'),
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

export async function getPaymentAccountByType(type: 'store' | 'accommodation' | 'registration') {
    const accounts = await getPaymentAccounts();
    return accounts.find(a => a.type === type) || null;
}

// --- User Lookup ---

export async function findUserByEmailOrPhone(emailOrPhone: string) {
    const users = await getUsers();
    const normalized = emailOrPhone.trim().toLowerCase();
    return users.find(u =>
        (u.email && u.email.toLowerCase() === normalized) ||
        (u.phoneNumber && u.phoneNumber === emailOrPhone.trim())
    ) || null;
}

// --- Booking Requests ---
// BookingRequests Sheet Columns:
// A: Id, B: Name, C: Email, D: Phone, E: AccommodationType, F: AccommodationId,
// G: Amount, H: PaymentProof, I: Status, J: CreatedAt, K: UniqueId (if registered user)

export async function getBookingRequests() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'BookingRequests!A:K',
        });

        const rows = response.data.values;
        if (!rows) return [];

        return rows.map((row, index) => ({
            id: row[0],
            name: row[1],
            email: row[2],
            phone: row[3],
            accommodationType: row[4],
            accommodationId: row[5],
            amount: row[6],
            paymentProof: row[7],
            status: row[8],
            createdAt: row[9],
            uniqueId: row[10] || '',
            rowIndex: index + 1
        })).filter(b => b.id !== 'ID');
    } catch (error) {
        console.warn("BookingRequests sheet might not exist yet.", error);
        return [];
    }
}

export async function createBookingRequest(data: any) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const bookingId = `BK-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const row = [
        bookingId,
        data.name,
        data.email,
        data.phone,
        data.accommodationType,
        data.accommodationId,
        data.amount,
        data.paymentProof || '',
        'Pending',
        timestamp,
        data.uniqueId || ''
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'BookingRequests!A:K',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values: [row]
        }
    });

    return bookingId;
}

export async function updateBookingRequestStatus(id: string, status: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");
    const sheets = await getSheetsClient();

    const bookings = await getBookingRequests();
    const target = bookings.find(b => b.id === id);
    if (!target) throw new Error("Booking request not found");

    const rowIndex = target.rowIndex;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `BookingRequests!I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[status]]
        }
    });

    return true;
}
