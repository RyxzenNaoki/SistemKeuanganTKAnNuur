import ComingSoon from '../../components/common/ComingSoon';
import { FolderUp } from 'lucide-react';

const GuruTeachingDocs = () => (
  <ComingSoon
    title="Upload RPPM & Modul Ajar"
    description="Panduan dan tempat mengunggah dokumen pembelajaran."
    icon={<FolderUp className="h-7 w-7" />}
    points={[
      'Gambar tutorial cara upload',
      'Link Google Drive untuk file pendukung pembuatan RPPM dan Modul Ajar',
    ]}
  />
);

export default GuruTeachingDocs;
