import { FolderOpen, ExternalLink } from 'lucide-react';
import { DRIVE_FOLDER_URL, TUTORIAL_STEPS } from '../../config/teachingResources';

const GuruTeachingDocs = () => (
  <div className="page-transition">
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Upload RPPM & Modul Ajar</h1>
      <p className="text-sm text-slate-500">Panduan dan tempat mengunggah dokumen pembelajaran</p>
    </div>

    <div className="card p-6 mb-6 bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col sm:flex-row items-center gap-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shrink-0">
        <FolderOpen className="h-8 w-8" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h2 className="font-semibold text-slate-900">Folder Google Drive Sekolah</h2>
        <p className="text-sm text-slate-500 mt-1">
          Semua template RPPM, Modul Ajar, dan berkas pendukung tersedia di sini. Upload dan simpan dokumen Anda langsung di folder ini.
        </p>
      </div>
      <a
        href={DRIVE_FOLDER_URL}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary flex items-center gap-2 shrink-0"
      >
        Buka Folder Drive
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>

    <div className="card p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Cara Upload</h2>
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

export default GuruTeachingDocs;
