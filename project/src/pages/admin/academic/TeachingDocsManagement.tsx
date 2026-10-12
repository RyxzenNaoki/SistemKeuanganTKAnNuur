import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Upload, FileText, Trash2, Download, ExternalLink, Save, FileCheck2 } from 'lucide-react';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getCurrentAcademicYear, getCurrentSemester, Semester } from '../../../services/studentService';
import {
  Prosem,
  fetchProsem,
  createProsem,
  deleteProsem,
  fetchTeachingResources,
  saveTeachingResources,
} from '../../../services/prosemService';
import { uploadToDrive, UPLOAD_ACCEPT } from '../../../utils/upload';
import { getDriveImageUrl, getDriveDownloadUrl } from '../../../utils/drive';
import { DRIVE_FOLDER_URL } from '../../../config/teachingResources';

const TeachingDocsManagement = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [adminName, setAdminName] = useState('');

  // ---- Prosem ----
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [semester, setSemester] = useState<Semester>(getCurrentSemester());
  const [prosemList, setProsemList] = useState<Prosem[]>([]);
  const [loadingProsem, setLoadingProsem] = useState(true);
  const [title, setTitle] = useState('');
  const [prosemFile, setProsemFile] = useState<File | null>(null);
  const [uploadingProsem, setUploadingProsem] = useState(false);

  // ---- Panduan RPPM ----
  const [folderUrl, setFolderUrl] = useState('');
  const [tutorialFileId, setTutorialFileId] = useState<string | undefined>();
  const [tutorialFile, setTutorialFile] = useState<File | null>(null);
  const [savingGuide, setSavingGuide] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (currentUser) {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setAdminName(snap.data().name || '');
      }
      try {
        const res = await fetchTeachingResources();
        setFolderUrl(res.driveFolderUrl ?? '');
        setTutorialFileId(res.tutorialImageFileId);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [currentUser]);

  const loadProsem = async () => {
    setLoadingProsem(true);
    try {
      setProsemList(await fetchProsem(academicYear, semester));
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat daftar prosem');
    } finally {
      setLoadingProsem(false);
    }
  };

  useEffect(() => {
    loadProsem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, semester]);

  const handleUploadProsem = async () => {
    if (!title.trim()) {
      showToast('error', 'Judul prosem wajib diisi');
      return;
    }
    if (!prosemFile) {
      showToast('error', 'Pilih file prosem terlebih dahulu');
      return;
    }
    setUploadingProsem(true);
    try {
      const uploaded = await uploadToDrive(prosemFile, 'prosem');
      await createProsem({
        title: title.trim(),
        semester,
        academicYear,
        fileId: uploaded.fileId,
        fileName: uploaded.fileName,
        uploadedByName: adminName || currentUser?.email || 'Admin',
      });
      showToast('success', 'Prosem berhasil diunggah');
      setTitle('');
      setProsemFile(null);
      await loadProsem();
    } catch (err) {
      console.error(err);
      showToast('error', err instanceof Error ? err.message : 'Gagal mengunggah prosem');
    } finally {
      setUploadingProsem(false);
    }
  };

  const handleDeleteProsem = async (item: Prosem) => {
    if (!window.confirm(`Hapus prosem "${item.title}"? Guru tidak akan bisa melihatnya lagi.`)) return;
    try {
      await deleteProsem(item.id);
      setProsemList(prev => prev.filter(p => p.id !== item.id));
      showToast('success', 'Prosem dihapus');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menghapus prosem');
    }
  };

  const handleSaveGuide = async () => {
    const trimmed = folderUrl.trim();
    if (trimmed && !/^https:\/\/drive\.google\.com\//.test(trimmed)) {
      showToast('error', 'Link harus berupa link Google Drive (https://drive.google.com/...)');
      return;
    }
    setSavingGuide(true);
    try {
      let imageId = tutorialFileId;
      if (tutorialFile) {
        imageId = (await uploadToDrive(tutorialFile, 'tutorial')).fileId;
      }
      await saveTeachingResources({ driveFolderUrl: trimmed || undefined, tutorialImageFileId: imageId });
      setTutorialFileId(imageId);
      setTutorialFile(null);
      showToast('success', 'Panduan RPPM & Modul Ajar disimpan');
    } catch (err) {
      console.error(err);
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan panduan');
    } finally {
      setSavingGuide(false);
    }
  };

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prosem & Dokumen Guru</h1>
        <p className="text-sm text-slate-500">File yang dibutuhkan guru: Program Semester dan panduan RPPM/Modul Ajar</p>
      </div>

      {/* ============ PROSEM ============ */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Program Semester (Prosem)</h2>
        <p className="text-xs text-slate-400 mb-4">Format: PDF, Word, Excel, atau gambar · maksimal 4 MB per file</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul *</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Prosem TK A Semester Ganjil" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
            <select className="input" value={semester} onChange={e => setSemester(e.target.value as Semester)}>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
            <input className="input" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2026/2027" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
            {prosemFile ? <FileCheck2 className="h-5 w-5 text-success-600" /> : <FileText className="h-5 w-5 text-slate-400" />}
            <span className="text-sm text-slate-500 truncate">{prosemFile ? prosemFile.name : 'Klik untuk pilih file prosem'}</span>
            <input type="file" accept={UPLOAD_ACCEPT.prosem} className="hidden" onChange={e => setProsemFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={handleUploadProsem} disabled={uploadingProsem} className="btn btn-primary flex items-center justify-center gap-2">
            {uploadingProsem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Unggah Prosem
          </button>
        </div>

        <h3 className="text-sm font-semibold text-slate-700 mb-2">Prosem {semester} {academicYear}</h3>
        {loadingProsem ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary-500" /></div>
        ) : prosemList.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada prosem untuk semester ini</p>
        ) : (
          <div className="space-y-2">
            {prosemList.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700"><FileText className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-400 truncate">{item.fileName} · {item.uploadedByName} · {dayjs(item.uploadedAt).format('DD MMM YYYY')}</p>
                </div>
                <a href={`https://drive.google.com/file/d/${item.fileId}/view`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary-600" title="Buka"><ExternalLink className="h-4 w-4" /></a>
                <a href={getDriveDownloadUrl(item.fileId)} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary-600" title="Unduh"><Download className="h-4 w-4" /></a>
                <button onClick={() => handleDeleteProsem(item)} className="p-2 text-slate-400 hover:text-error-600" title="Hapus"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ PANDUAN RPPM ============ */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Panduan Upload RPPM & Modul Ajar</h2>
        <p className="text-xs text-slate-400 mb-4">Tampil di halaman "Upload RPPM & Modul Ajar" milik guru.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Link Folder Google Drive</label>
          <input
            className="input"
            value={folderUrl}
            onChange={e => setFolderUrl(e.target.value)}
            placeholder={DRIVE_FOLDER_URL.includes('GANTI') ? 'https://drive.google.com/drive/folders/...' : DRIVE_FOLDER_URL}
          />
          <p className="mt-1 text-xs text-slate-400">
            Folder ini dipakai guru untuk menyimpan RPPM/Modul Ajar. Pastikan dibagikan ke guru dengan akses <strong>Editor</strong>.
            Kosongkan untuk memakai link bawaan di kode.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Tutorial (opsional)</label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {tutorialFileId && !tutorialFile && (
              <img src={getDriveImageUrl(tutorialFileId)} alt="Tutorial" className="h-32 rounded-xl border border-slate-100 object-contain bg-slate-50" />
            )}
            <label className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-500">{tutorialFile ? tutorialFile.name : tutorialFileId ? 'Ganti gambar tutorial' : 'Pilih gambar tutorial'}</span>
              <input type="file" accept={UPLOAD_ACCEPT.tutorial} className="hidden" onChange={e => setTutorialFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <button onClick={handleSaveGuide} disabled={savingGuide} className="btn btn-primary flex items-center gap-2">
          {savingGuide ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Panduan
        </button>
      </div>
    </div>
  );
};

export default TeachingDocsManagement;
