// upload.js
import { google } from 'googleapis';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const serviceAccountBase64 = process.env.GOOGLE_SERVICE_KEY_BASE64;
if (!serviceAccountBase64) throw new Error('Missing GOOGLE_SERVICE_KEY_BASE64');

const serviceAccountJSON = JSON.parse(
  Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
);

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountJSON,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      return res.status(400).json({ error: 'File not found in request' });
    }

    const file = files.file[0];

    try {
      const fileMeta = {
        name: file.originalFilename,
        parents: [process.env.GDRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.filepath),
      };

      const driveRes = await drive.files.create({
        requestBody: fileMeta,
        media,
        fields: 'id',
      });

      const fileId = driveRes.data.id;

      // Make the file public
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const publicUrl = `https://drive.google.com/uc?id=${fileId}`;

      res.status(200).json({ success: true, link: publicUrl });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
}
