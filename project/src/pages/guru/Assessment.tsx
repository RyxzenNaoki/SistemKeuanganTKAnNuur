import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Upload, Image as ImageIcon, Send, Plus, FileText, Trash2, Download, Reply } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useStudents } from '../../hooks/useStudents';
import { getCurrentAcademicYear, getCurrentSemester, getDisplayName, Semester } from '../../services/studentService';
import { fetchThemes, createTheme, Theme } from '../../services/curriculumService';
import {
  AssessmentCategory,
  ASSESSMENT_CATEGORY_LABEL,
  AssessmentEntry,
  createAssessment,
  fetchAssessmentsByStudent,
  addTeacherReply,
} from '../../services/assessmentService';
import { getDriveImageUrl, getDriveDownloadUrl } from '../../utils/drive';
import {
  ReportCard,
  fetchReportCardsByStudent,
  createReportCard,
  deleteReportCard,
} from '../../services/reportCardService';

type GuruTab = AssessmentCategory | 'pdf';

const TAB_LABEL: Record<GuruTab, string> = {
  ...ASSESSMENT_CATEGORY_LABEL,
  pdf: 'File PDF Rapor',
};

const TABS: GuruTab[] = ['karya', 'kegiatan', 'catatan', 'pdf'];

const GuruAssessment = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { students, loading: studentsLoading } = useStudents({ onlyActive: true });

  const [teacherName, setTeacherName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<GuruTab>('karya');

  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeChoice, setThemeChoice] = useState('');
  const [newTheme, setNewTheme] = useState('');

  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState<AssessmentEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  // Khusus tab "File PDF Rapor"
  const [reportSemester, setReportSemester] = useState<Semester>(getCurrentSemester());
  const [reportYear, setReportYear] = useState(getCurrentAcademicYear());
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);

  const selectedStudent = students.find(s => s.id === studentId);
  const semester = getCurrentSemester();
  const academicYear = getCurrentAcademicYear();

  useEffect(() => {
    const loadName = async () => {
      if (!currentUser) return;
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) setTeacherName(snap.data().name || '');
    };
    loadName();
  }, [currentUser]);

  useEffect(() => {
    if (students.length > 0 && !studentId) setStudentId(students[0].id ?? '');
  }, [students, studentId]);

  useEffect(() => {
    if (category === 'karya') {
      fetchThemes(academicYear, semester).then(setThemes).catch(console.error);
    }
  }, [category, academicYear, semester]);

  const loadReportCards = async () => {
    if (!studentId) return;
    setHistoryLoading(true);
    try {
      setReportCards(await fetchReportCardsByStudent(studentId));
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!studentId || category === 'pdf') return;
    setHistoryLoading(true);
    try {
      setHistory(await fetchAssessmentsByStudent(studentId, category as AssessmentCategory));
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (category === 'pdf') {
      loadReportCards();
    } else {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, category]);

  const resetForm = () => {
    setNote('');
    setPhotoFile(null);
    setThemeChoice('');
    setNewTheme('');
    setReportFile(null);
  };

  const handleUploadReportCard = async () => {
    if (!currentUser || !selectedStudent) return;
    if (!reportFile) {
      showToast('error', 'Pilih file PDF rapor terlebih dahulu');
      return;
    }
    if (reportFile.type !== 'application/pdf') {
      showToast('error', 'File harus berformat PDF');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', reportFile);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload gagal');
      const data = await res.json();
      if (!data?.fileId) throw new Error('Upload berhasil tapi fileId tidak ditemukan');

      await createReportCard({
        studentId: selectedStudent.id ?? '',
        studentName: selectedStudent.name,
        parentUid: selectedStudent.parentUid ?? '',
        class: selectedStudent.class,
        semester: reportSemester,
        academicYear: reportYear,
        fileId: data.fileId,
        fileName: data.fileName || reportFile.name,
        uploadedByName: teacherName || currentUser.email || 'Guru',
      });

      showToast('success', `Rapor ${selectedStudent.name} semester ${reportSemester} tersimpan`);
      resetForm();
      loadReportCards();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal mengunggah rapor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReportCard = async (id: string) => {
    if (!window.confirm('Hapus file rapor ini?')) return;
    try {
      await deleteReportCard(id);
      setReportCards(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menghapus rapor');
    }
  };

  const handleSendReply = async (assessmentId: string) => {
    const message = replyDraft[assessmentId]?.trim();
    if (!message) return;
    setSendingReply(assessmentId);
    try {
      await addTeacherReply(assessmentId, message);
      setHistory(prev =>
        prev.map(e =>
          e.id === assessmentId && e.parentFeedback
            ? { ...e, parentFeedback: { ...e.parentFeedback, teacherReply: { message, createdAt: new Date() } } }
            : e
        )
      );
      setReplyDraft(prev => ({ ...prev, [assessmentId]: '' }));
    } catch (err) {
      console.error('Gagal mengirim balasan:', err);
      showToast('error', 'Gagal mengirim balasan');
    } finally {
      setSendingReply(null);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !selectedStudent || category === 'pdf') return;
    const activeCategory: AssessmentCategory = category;

    if (category === 'catatan' && !note.trim()) {
      showToast('error', 'Catatan tidak boleh kosong');
      return;
    }
    if (category === 'karya' && !themeChoice && !newTheme.trim()) {
      showToast('error', 'Pilih atau tambahkan tema pembelajaran');
      return;
    }

    setSubmitting(true);
    try {
      let photoFileId: string | undefined;
      if (photoFile) {
        const form = new FormData();
        form.append('file', photoFile);
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        if (!res.ok) throw new Error('Upload foto gagal');
        const data = await res.json();
        if (!data?.fileId) throw new Error('Upload berhasil tapi fileId tidak ditemukan');
        photoFileId = data.fileId;
      }

      let theme: string | undefined;
      if (category === 'karya') {
        theme = themeChoice || newTheme.trim();
        if (!themeChoice && newTheme.trim()) {
          await createTheme({ name: newTheme.trim(), semester, academicYear });
        }
      }

      await createAssessment({
        studentId: selectedStudent.id ?? '',
        studentName: selectedStudent.name,
        parentUid: selectedStudent.parentUid ?? '',
        class: selectedStudent.class,
        category: activeCategory,
        theme,
        semester,
        academicYear,
        note: note.trim(),
        photoFileId,
        teacherUid: currentUser.uid,
        teacherName: teacherName || currentUser.email || 'Guru',
      });

      showToast('success', `${ASSESSMENT_CATEGORY_LABEL[activeCategory]} untuk ${selectedStudent.name} tersimpan`);
      resetForm();
      loadHistory();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menyimpan asesmen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rekap Asesmen</h1>
        <p className="text-sm text-slate-500">Semester {semester} {academicYear}</p>
      </div>

      <div className="mb-6 max-w-sm">
        <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Murid</label>
        <select className="input" value={studentId} onChange={e => setStudentId(e.target.value)} disabled={studentsLoading}>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.nickname ? `(${getDisplayName(s)})` : ''} — {s.class}
            </option>
          ))}
        </select>
      </div>

      {/* Tab kategori */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              category === c ? 'bg-primary-500 text-white shadow-soft' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {TAB_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form input */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Tambah {TAB_LABEL[category]}</h2>

          {category === 'pdf' ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                  <select className="input" value={reportSemester} onChange={e => setReportSemester(e.target.value as Semester)}>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
                  <input className="input" value={reportYear} onChange={e => setReportYear(e.target.value)} placeholder="2026/2027" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">File PDF Rapor</label>
                <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-500">{reportFile ? reportFile.name : 'Klik untuk pilih file PDF'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => setReportFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <button
                onClick={handleUploadReportCard}
                disabled={submitting || !selectedStudent}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Unggah Rapor
              </button>
            </>
          ) : (
            <>
              {category === 'karya' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tema Pembelajaran</label>
                  <select
                    className="input mb-2"
                    value={themeChoice}
                    onChange={e => setThemeChoice(e.target.value)}
                  >
                    <option value="">Pilih tema yang sudah ada...</option>
                    {themes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-slate-400" />
                    <input
                      className="input"
                      placeholder="atau tulis tema baru"
                      value={newTheme}
                      onChange={e => { setNewTheme(e.target.value); setThemeChoice(''); }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Tema baru otomatis tersimpan untuk dipakai lagi nanti.</p>
                </div>
              )}

              {category !== 'catatan' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Foto</label>
                  <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-500">{photoFile ? photoFile.name : 'Klik untuk pilih foto'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {category === 'catatan' ? 'Catatan *' : 'Keterangan'}
                </label>
                <textarea
                  className="input"
                  rows={4}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={category === 'catatan' ? 'Tulis catatan perkembangan anak...' : 'Keterangan singkat (opsional)'}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedStudent}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Simpan
              </button>
            </>
          )}
        </div>

        {/* Riwayat */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">
            Riwayat {TAB_LABEL[category]} — {selectedStudent?.name ?? '...'}
          </h2>

          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            </div>
          ) : category === 'pdf' ? (
            reportCards.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Belum ada rapor diupload</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {reportCards.map(rc => (
                  <div key={rc.id} className="rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-100 text-accent-700 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Semester {rc.semester} {rc.academicYear}</p>
                      <p className="text-xs text-slate-400 truncate">{rc.fileName}</p>
                      <p className="text-xs text-slate-400">{rc.uploadedByName} · {dayjs(rc.uploadedAt).format('DD MMM YYYY')}</p>
                    </div>
                    <a href={getDriveDownloadUrl(rc.fileId)} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-primary-600">
                      <Download className="h-4 w-4" />
                    </a>
                    <button onClick={() => handleDeleteReportCard(rc.id)} className="p-2 text-slate-400 hover:text-error-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Belum ada data</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {history.map(entry => (
                <div key={entry.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start gap-3">
                    {entry.photoFileId && (
                      <img
                        src={getDriveImageUrl(entry.photoFileId)}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover shrink-0"
                      />
                    )}
                    {!entry.photoFileId && category !== 'catatan' && (
                      <div className="h-14 w-14 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {entry.theme && <span className="badge badge-primary mb-1">{entry.theme}</span>}
                      {entry.note && <p className="text-sm text-slate-700 line-clamp-2">{entry.note}</p>}
                      <p className="text-xs text-slate-400 mt-1">
                        {entry.teacherName} · {dayjs(entry.createdAt).format('DD MMM YYYY, HH:mm')}
                      </p>
                      {entry.parentFeedback && (
                        <div className="mt-2 space-y-2">
                          <div className="rounded-lg bg-secondary-50 border border-secondary-100 px-2.5 py-2">
                            <p className="text-[11px] font-medium text-secondary-700">Feedback Orang Tua</p>
                            <p className="text-xs text-slate-700 mt-0.5">{entry.parentFeedback.message}</p>
                          </div>

                          {entry.parentFeedback.teacherReply ? (
                            <div className="rounded-lg bg-primary-50 border border-primary-100 px-2.5 py-2">
                              <p className="text-[11px] font-medium text-primary-700">Balasan Anda</p>
                              <p className="text-xs text-slate-700 mt-0.5">{entry.parentFeedback.teacherReply.message}</p>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                className="input text-sm py-1.5"
                                placeholder="Balas feedback orang tua..."
                                value={replyDraft[entry.id] ?? ''}
                                onChange={e => setReplyDraft(prev => ({ ...prev, [entry.id]: e.target.value }))}
                              />
                              <button
                                onClick={() => handleSendReply(entry.id)}
                                disabled={sendingReply === entry.id || !replyDraft[entry.id]?.trim()}
                                className="btn btn-primary px-2.5"
                              >
                                {sendingReply === entry.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Reply className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuruAssessment;
