import ComingSoon from '../../components/common/ComingSoon';
import { ClipboardCheck } from 'lucide-react';

const GuruAttendance = () => (
  <ComingSoon
    title="Rekap Absensi"
    description="Absensi murid per hari."
    icon={<ClipboardCheck className="h-7 w-7" />}
    points={[
      'Centang kehadiran murid setiap hari',
      'Nama murid otomatis diambil dari Data Siswa',
      'Persentase kehadiran per anak tampil di Beranda',
    ]}
  />
);

export default GuruAttendance;
