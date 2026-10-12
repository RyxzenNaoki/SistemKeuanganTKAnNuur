import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_HOME } from '../../config/roles';
import { APP_NAME, APP_FULL_NAME, SCHOOL_NAME, APP_DESCRIPTION } from '../../config/branding';
import {
  PRIVACY_LAST_UPDATED,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_CONTACT_PHONE,
  PRIVACY_CONTACT_ADDRESS,
  isContactEmailConfigured,
} from '../../config/privacy';

interface Section {
  title: string;
  content: ReactNode;
}

const Bullets = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((item, idx) => (
      <li key={idx}>{item}</li>
    ))}
  </ul>
);

const SECTIONS: Section[] = [
  {
    title: 'Tentang Kebijakan Ini',
    content: (
      <p>
        {APP_NAME} ({APP_FULL_NAME}) adalah aplikasi manajemen digital yang dikelola oleh {SCHOOL_NAME} (selanjutnya
        disebut "Sekolah" atau "kami"). Kebijakan ini menjelaskan data apa saja yang kami kumpulkan, untuk apa data
        tersebut digunakan, siapa yang dapat mengaksesnya, bagaimana kami menjaganya, serta hak Anda atas data
        tersebut. Dengan membuat akun dan menggunakan {APP_NAME}, Anda menyatakan telah membaca dan memahami
        kebijakan ini.
      </p>
    ),
  },
  {
    title: 'Data yang Kami Kumpulkan',
    content: (
      <div className="space-y-4">
        <div>
          <p className="font-medium text-slate-800">1. Data akun</p>
          <Bullets
            items={[
              'Nama lengkap, alamat email, dan peran akun (orang tua, guru, atau admin).',
              'Kata sandi dikelola oleh layanan Firebase Authentication dalam bentuk terenkripsi. Admin dan pihak Sekolah tidak dapat melihat kata sandi Anda.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-slate-800">2. Data anak/siswa</p>
          <Bullets
            items={[
              'Nama lengkap, nama panggilan, kelas, dan tahun ajaran.',
              'Data yang diisi atau dilengkapi admin Sekolah sesuai kebutuhan administrasi, misalnya tanggal lahir, alamat, nama dan kontak orang tua, kontak darurat, serta catatan kesehatan bila diperlukan.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-slate-800">3. Data kegiatan belajar</p>
          <Bullets
            items={[
              'Absensi harian.',
              'Asesmen dari guru: foto hasil karya, foto kegiatan, dan catatan perkembangan, beserta tema pembelajaran dan tanggalnya.',
              'Umpan balik (feedback) dari orang tua dan balasan guru.',
              'File PDF rapor per semester.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-slate-800">4. Data pembayaran</p>
          <Bullets
            items={[
              'Tagihan yang dikirim Sekolah, status pembayaran, dan riwayatnya.',
              'Bukti transfer yang Anda unggah (gambar atau PDF), nominal, tanggal, nomor referensi, dan catatan.',
              'Kami tidak menyimpan nomor kartu atau kata sandi perbankan Anda. Pembayaran dilakukan lewat transfer bank di luar aplikasi.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-slate-800">5. Data teknis</p>
          <p>
            Agar Anda tetap masuk ke akun, browser menyimpan data sesi login pada penyimpanan lokal perangkat Anda.
            Penyedia hosting kami juga dapat mencatat log teknis standar (misalnya alamat IP dan waktu akses) untuk
            menjaga keamanan dan kestabilan layanan. Kami tidak memakai pelacak iklan.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Tujuan Penggunaan Data',
    content: (
      <Bullets
        items={[
          'Mengelola akun dan hak akses pengguna.',
          'Menampilkan perkembangan, absensi, rapor, dan dokumentasi kegiatan anak kepada orang tua yang berhak.',
          'Membantu guru mencatat absensi dan asesmen, serta membantu admin mengelola data siswa, kelas, jadwal, dan program belajar.',
          'Mengelola tagihan, memverifikasi bukti pembayaran, dan menyusun laporan keuangan Sekolah.',
          'Mengirim pengumuman dan informasi terkait kegiatan Sekolah.',
          'Menjaga keamanan layanan serta memenuhi kewajiban administrasi dan hukum.',
        ]}
      />
    ),
  },
  {
    title: 'Siapa yang Dapat Mengakses Data',
    content: (
      <div className="space-y-3">
        <p>Akses dibatasi sesuai peran akun:</p>
        <Bullets
          items={[
            <>
              <strong>Orang tua</strong> hanya dapat melihat data anaknya sendiri: tagihan, riwayat pembayaran, absensi
              yang relevan, asesmen, foto, catatan guru, dan rapor.
            </>,
            <>
              <strong>Guru</strong> yang akunnya telah disetujui admin dapat melihat data siswa, mencatat absensi dan
              asesmen, serta mengunggah rapor.
            </>,
            <>
              <strong>Admin</strong> Sekolah dapat mengelola seluruh data, termasuk data siswa, pengguna, dan keuangan.
            </>,
          ]}
        />
        <p>
          Foto dan catatan yang diunggah guru ditautkan ke satu murid dan hanya ditampilkan di akun orang tua murid
          tersebut. Kami tidak menjual data pribadi dan tidak membagikannya kepada pihak ketiga untuk keperluan
          iklan atau pemasaran.
        </p>
      </div>
    ),
  },
  {
    title: 'Penyedia Layanan Pihak Ketiga',
    content: (
      <div className="space-y-3">
        <p>Untuk menjalankan aplikasi, kami memakai penyedia layanan berikut sebagai pemroses data atas nama Sekolah:</p>
        <Bullets
          items={[
            <>
              <strong>Google Firebase</strong> (Authentication dan Cloud Firestore) untuk login dan penyimpanan data
              aplikasi.
            </>,
            <>
              <strong>Google Drive</strong> untuk menyimpan berkas yang diunggah (foto, PDF rapor, bukti pembayaran,
              prosem).
            </>,
            <>
              <strong>Vercel</strong> untuk hosting aplikasi dan fungsi unggah berkas.
            </>,
          ]}
        />
        <p>
          Server penyedia layanan tersebut dapat berada di luar Indonesia. Kami hanya membagikan data sejauh
          diperlukan agar layanan berjalan, atau jika diwajibkan oleh hukum yang berlaku.
        </p>
      </div>
    ),
  },
  {
    title: 'Penggunaan Google Drive dan Kebijakan Data Pengguna Google API',
    content: (
      <div className="space-y-3">
        <p>
          {APP_NAME} memakai Google Drive API melalui <strong>satu akun Google milik Sekolah</strong> untuk menyimpan
          dan menampilkan berkas yang diunggah pengguna. Hal ini berarti:
        </p>
        <Bullets
          items={[
            'Pengguna aplikasi (orang tua, guru, admin) tidak diminta login dengan Google dan tidak memberikan akses ke akun Google atau Google Drive pribadi mereka.',
            'Akses ke Google Drive hanya dipakai untuk membuat berkas di folder penyimpanan milik Sekolah dan mengatur izin lihat berkas tersebut. Kami tidak membaca, memindai, atau menggunakan berkas lain di Drive.',
            'Berkas yang diunggah dapat dibuka oleh siapa pun yang memegang tautannya. Tautan tidak dipublikasikan dan hanya ditampilkan di dalam aplikasi kepada pengguna yang berhak. Jangan membagikan tautan berkas kepada pihak yang tidak berkepentingan.',
          ]}
        />
        <p>
          Penggunaan dan pengalihan informasi yang diterima dari Google API oleh {APP_NAME} mematuhi{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
            className="text-primary-600 underline hover:text-primary-700"
          >
            Kebijakan Data Pengguna Layanan Google API
          </a>
          , termasuk persyaratan Penggunaan Terbatas (Limited Use). Data dari Google API tidak digunakan untuk iklan,
          tidak dijual, dan tidak dipakai untuk melatih model kecerdasan buatan.
        </p>
      </div>
    ),
  },
  {
    title: 'Data Anak',
    content: (
      <p>
        {APP_NAME} ditujukan bagi orang tua/wali dan staf Sekolah; anak tidak membuat atau menggunakan akun sendiri.
        Data dan foto anak diberikan oleh orang tua atau dicatat oleh Sekolah dalam rangka kegiatan belajar. Dengan
        mendaftar, orang tua menyatakan berwenang memberikan data anak tersebut kepada Sekolah. Kami memperlakukan
        data anak dengan kehati-hatian ekstra dan membatasi aksesnya hanya bagi pihak yang berkepentingan.
      </p>
    ),
  },
  {
    title: 'Keamanan dan Penyimpanan Data',
    content: (
      <div className="space-y-3">
        <Bullets
          items={[
            'Seluruh komunikasi dengan aplikasi memakai koneksi terenkripsi (HTTPS).',
            'Aturan akses basis data diterapkan per peran sehingga setiap akun hanya dapat membaca dan menulis data yang menjadi haknya.',
            'Akun guru harus disetujui admin sebelum dapat digunakan, dan akun admin dibuat secara manual oleh pengelola sistem.',
          ]}
        />
        <p>
          Data disimpan selama diperlukan untuk tujuan yang dijelaskan di atas, misalnya selama anak terdaftar di
          Sekolah dan untuk keperluan arsip administrasi atau keuangan. Setelah tidak diperlukan, data dapat dihapus
          atau dianonimkan atas permintaan Anda, kecuali jika Sekolah wajib menyimpannya sesuai ketentuan hukum.
          Perlu dipahami bahwa tidak ada sistem yang sepenuhnya bebas risiko; kami berupaya wajar menjaga data Anda,
          namun tidak dapat menjamin keamanan mutlak.
        </p>
      </div>
    ),
  },
  {
    title: 'Hak Anda',
    content: (
      <div className="space-y-3">
        <p>
          Sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda berhak untuk:
        </p>
        <Bullets
          items={[
            'Mengetahui dan meminta salinan data pribadi Anda dan anak Anda yang kami simpan.',
            'Meminta pembaruan atau perbaikan data yang tidak akurat.',
            'Meminta penghapusan data atau penutupan akun.',
            'Menarik persetujuan atau mengajukan keberatan atas pemrosesan data tertentu.',
          ]}
        />
        <p>
          Untuk menggunakan hak tersebut, hubungi Sekolah melalui kontak di bawah. Kami akan memproses permintaan
          Anda dalam waktu yang wajar setelah identitas Anda dapat dipastikan.
        </p>
      </div>
    ),
  },
  {
    title: 'Perubahan Kebijakan',
    content: (
      <p>
        Kebijakan ini dapat diperbarui sewaktu-waktu mengikuti perkembangan layanan atau peraturan. Tanggal
        pembaruan terakhir tercantum di bagian atas halaman ini. Perubahan penting akan kami informasikan melalui
        pengumuman di aplikasi.
      </p>
    ),
  },
  {
    title: 'Hubungi Kami',
    content: (
      <div className="space-y-1.5">
        <p>Pertanyaan atau permintaan terkait data pribadi dapat disampaikan kepada:</p>
        <p className="font-medium text-slate-800">{SCHOOL_NAME}</p>
        {PRIVACY_CONTACT_ADDRESS && <p>{PRIVACY_CONTACT_ADDRESS}</p>}
        {isContactEmailConfigured && (
          <p>
            Email:{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="text-primary-600 underline hover:text-primary-700">
              {PRIVACY_CONTACT_EMAIL}
            </a>
          </p>
        )}
        {PRIVACY_CONTACT_PHONE && <p>Telepon/WhatsApp: {PRIVACY_CONTACT_PHONE}</p>}
        <p>Orang tua juga dapat menghubungi admin melalui menu Kontak Admin di dalam aplikasi.</p>
      </div>
    ),
  },
];

const PrivacyPolicyPage = () => {
  const { currentUser, userRole } = useAuth();
  const backTo = currentUser && userRole ? ROLE_HOME[userRole] : '/login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-primary-400 to-secondary-400 p-2 rounded-xl shadow-soft">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900">{APP_NAME}</p>
              <p className="text-[11px] text-slate-400">{APP_DESCRIPTION}</p>
            </div>
          </div>
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            {currentUser ? 'Kembali ke aplikasi' : 'Kembali ke halaman masuk'}
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-10 shadow-soft-lg">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Kebijakan Privasi</h1>
              <p className="text-sm text-slate-400">Terakhir diperbarui: {PRIVACY_LAST_UPDATED}</p>
            </div>
          </div>

          <div className="space-y-7 text-sm leading-relaxed text-slate-600">
            {SECTIONS.map((section, idx) => (
              <section key={section.title}>
                <h2 className="mb-2 text-base font-semibold text-slate-900">
                  {idx + 1}. {section.title}
                </h2>
                {section.content}
              </section>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {SCHOOL_NAME}
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
