import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function getDriveClient() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    // Handle private key newlines correctly
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error("Missing Google Drive credentials in environment variables.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}

export async function uploadFile(file: File) {
    const drive = await getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
        throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // console.log("Uploading to folder:", folderId);

    const fileMetadata = {
        name: file.name,
        parents: [folderId],
    };

    const media = {
        mimeType: file.type,
        body: stream,
    };

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink, thumbnailLink',
            supportsAllDrives: true,
        });

        // Make the file publicly readable so it can be displayed
        if (response.data.id) {
            await drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
                supportsAllDrives: true,
            });
        }

        return response.data;
    } catch (error: any) {
        console.error("Google Drive Upload Error:", error);
        throw error;
    }
}

export async function deleteFile(fileId: string) {
    const drive = await getDriveClient();
    try {
        await drive.files.delete({
            fileId: fileId,
        });
        return true;
    } catch (error) {
        console.error("Error deleting file from Drive:", error);
        return false;
    }
}
