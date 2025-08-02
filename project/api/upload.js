import multer from 'multer';
import { google } from 'googleapis';
import stream from 'stream';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Method Not Allowed' });
  }

  upload.single('file')(req, res, async function (err) {
    if (err) {
      console.error('Upload Error:', err);
      return res.status(500).send({ message: 'Upload gagal' });
    }

    const { originalname, buffer, mimetype } = req.file;

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      const fileMetadata = {
        name: originalname,
        parents: [process.env.GOOGLE_FOLDER_ID], // optional, for specific folder
      };

      const media = {
        mimeType: mimetype,
        body: bufferStream,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name',
      });

      return res.status(200).json({
        message: 'Upload berhasil',
        fileId: response.data.id,
        fileName: response.data.name,
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ message: 'Upload ke Google Drive gagal' });
    }
  });
}
