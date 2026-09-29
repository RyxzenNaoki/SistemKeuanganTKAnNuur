import ComingSoon from '../../components/common/ComingSoon';
import { ClipboardList } from 'lucide-react';

const GuruAssessment = () => (
  <ComingSoon
    title="Rekap Asesmen"
    description="Asesmen murid beserta bukti foto."
    icon={<ClipboardList className="h-7 w-7" />}
    points={[
      'Asesmen Hasil Karya',
      'Asesmen Foto Berkegiatan',
      'Catatan Guru',
      'Setiap entri memuat timestamp, tema, dan keterangan per murid',
    ]}
  />
);

export default GuruAssessment;
