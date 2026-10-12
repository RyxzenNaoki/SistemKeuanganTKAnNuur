import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { FolderOpen, ExternalLink, FileText, Download, Loader2 } from 'lucide-react';
import { DRIVE_FOLDER_URL, TUTORIAL_STEPS } from '../../config/teachingResources';
import { getCurrentAcademicYear, getCurrentSemester } from '../../services/studentService';
import { Prosem, TeachingResources, fetchProsem, fetchTeachingResources } from '../../services/prosemService';
import { getDriveImageUrl, getDriveDownloadUrl } from '../../utils/drive';

const GuruTeachingDocs = () => {
  const [resources, setResources] = useState<TeachingResources>({});
  const [prosemList, setProsemList] = useState<Prosem[]>([]);
  const [loading, setLoading] = useState(true);

  const semester = getCurrentSemester();
  const academicYear = getCurrentAcademicYear();

  useEffect(() => {
    const load = async () => {
      try {
        const [res, prosem] = await Promise.all([
          fetchTeachingResources(),
          fetchProsem(academicYear, semester),
        ]);
        setResources(res);
        setProsemList(prosem);
      } catch (err) {
        console.error('Gagal memuat dokumen guru:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [academicYear, semester]);

  // Link dari pengaturan admin diprioritaskan; link di kode jadi cadangan
  const folderUrl =
    resources.driveFolderUrl || (DRIVE_FOLDER_URL.includes('GANTI_DENGAN') ? '' : DRIVE_FOLDER_URL);

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload RPPM & Modul Ajar</h1>
        <p className="text-sm text-slate-500">Panduan, prosem, dan tempat mengunggah dokumen pembelajaran</p>
      </div>

      {/* Prosem dari admin */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Program Semester (Prosem)</h2>
        <p className="text-xs text-slate-400 mb-4">Semester {semester} {academicYear} — acuan tema dan kegiatan dari admin</p>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary-500" /></div>
        ) : prosemList.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Admin belum mengunggah prosem untuk semester ini</p>
        ) : (
          <div className="space-y-2">
            {prosemList.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700"><FileText className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-400 truncate">{item.fileName} · diunggah {dayjs(item.uploadedAt).format('DD MMM YYYY')}</p>
                </div>
                <a href={`https://drive.google.com/file/d/${item.fileId}/view`} target="_blank" rel="noreferrer" className="btn btn-secondary flex items-center gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" /> Buka
                </a>
                <a href={getDriveDownloadUrl(item.fileId)} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary-600" title="Unduh">
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Folder Drive */}
      <div className="card p-6 bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shrink-0">
          <FolderOpen className="h-8 w-8" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-semibold text-slate-900">Folder Google Drive Sekolah</h2>
          <p className="text-sm text-slate-500 mt-1">
            Template RPPM, Modul Ajar, dan berkas pendukung ada di sini. Simpan dokumen Anda langsung di folder ini.
          </p>
          {!folderUrl && (
            <p className="text-xs text-error-600 mt-1">Link folder belum diatur oleh admin. Hubungi admin sekolah.</p>
          )}
        </div>
        {folderUrl ? (
          <a href={folderUrl} target="_blank" rel="noreferrer" className="btn btn-primary flex items-center gap-2 shrink-0">
            Buka Folder Drive <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <button disabled className="btn btn-primary opacity-50 cursor-not-allowed shrink-0">Buka Folder Drive</button>
        )}
      </div>

      {/* Tutorial */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Cara Upload</h2>
        {resources.tutorialImageFileId && (
          <img
            src={getDriveImageUrl(resources.tutorialImageFileId)}
            alt="Tutorial upload RPPM dan Modul Ajar"
            className="mb-5 w-full max-h-96 rounded-xl border border-slate-100 object-contain bg-slate-50"
          />
        )}
        <ol className="space-y-4">
          {TUTORIAL_STEPS.map((step, idx) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-800 font-semibold text-sm">
                {idx + 1}
              </span>
              <div>
                <p className="font-medium text-slate-900">{step.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default GuruTeachingDocs;
