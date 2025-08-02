// /pages/api/upload.js
import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Karena kita pakai formidable
  },
};

// OAuth2 credentials — taruh ini di environment variables Vercel
const CLIENT_ID = process.env.GDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GDRIVE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GDRIVE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Failed to parse form' });
    }

    const file = files.file;

    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'File not found in request' });
    }

    try {
      const fileMetadata = {
        name: file.originalFilename,
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.filepath),
      };

      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id',
      });

      const fileId = uploadedFile.data.id;

      // Set permission to public
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get the public URL
      const fileInfo = await drive.files.get({
        fileId,
        fields: 'webViewLink',
      });

      return res.status(200).json({ url: fileInfo.data.webViewLink });
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}
