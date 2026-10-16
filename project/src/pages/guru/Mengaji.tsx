import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Plus, Trash2, Save, BookOpen, AlertTriangle, Send } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useStudents } from '../../hooks/useStudents';
import { getCurrentAcademicYear, getCurrentSemester, getDisplayName, Semester } from '../../services/studentService';
import { SURAH_SUGGESTIONS, JILID_SUGGESTIONS } from '../../config/mengaji';
import {
  HafalanStatus,
  HafalanTarget,
  HAFALAN_LABEL,
  MengajiBase,
  MengajiReport,
  fetchMengajiReport,
  saveHafalanTargets,
  addMengajiProgress,
  addMengajiNote,
  removeMengajiProgress,
  removeMengajiNote,
  mengajiReportId,
  sortProgressNewestFirst,
} from '../../services/mengajiService';

const STATUS_STYLE: Record<HafalanStatus, string> = {
  belum: 'border-slate-200 text-slate-500',
  proses: 'border-accent-300 bg-accent-50 text-accent-800',
  hafal: 'border-success-300 bg-success-50 text-success-700',
};

// Daftar target yang bisa ditambah/diubah/dihapus (surat atau hadits)
const TargetEditor = ({
  title,
  items,
  onChange,
  suggestions,
  listId,
  placeholder,
}: {
  title: string;
  items: HafalanTarget[];
  onChange: (next: HafalanTarget[]) => void;
  suggestions?: string[];
  listId: string;
  placeholder: string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <span className="text-xs text-slate-400">
        {items.filter(i => i.status === 'hafal').length}/{items.length} hafal
      </span>
    </div>
    {suggestions && (
      <datalist id={listId}>
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    )}
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="input flex-1"
            list={suggestions ? listId : undefined}
            value={item.name}
            placeholder={placeholder}
            onChange={e => onChange(items.map((it, i) => (i === idx ? { ...it, name: e.target.value } : it)))}
          />
          <select
            className={`input w-40 ${STATUS_STYLE[item.status]}`}
            value={item.status}
            onChange={e => onChange(items.map((it, i) => (i === idx ? { ...it, status: e.target.value as HafalanStatus } : it)))}
          >
            {(Object.keys(HAFALAN_LABEL) as HafalanStatus[]).map(s => (
              <option key={s} value={s}>{HAFALAN_LABEL[s]}</option>
            ))}
          </select>
          <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="p-2 text-slate-400 hover:text-error-600" title="Hapus">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
    <button
      onClick={() => onChange([...items, { name: '', status: 'belum' }])}
      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
    >
      <Plus className="h-4 w-4" /> Tambah
    </button>
  </div>
);

const GuruMengaji = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { students, loading: studentsLoading } = useStudents({ onlyActive: true });

  const [teacherName, setTeacherName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState<Semester>(getCurrentSemester());
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());

  const [report, setReport] = useState<MengajiReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [surat, setSurat] = useState<HafalanTarget[]>([]);
  const [hadits, setHadits] = useState<HafalanTarget[]>([]);
  const [savingTargets, setSavingTargets] = useState(false);

  const [pDate, setPDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [pJilid, setPJilid] = useState('');
  const [pHalaman, setPHalaman] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const student = students.find(s => s.id === studentId);

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

  const base: MengajiBase | null = student
    ? {
        studentId: student.id ?? '',
        studentName: student.name,
        parentUid: student.parentUid ?? '',
        class: student.class,
        semester,
        academicYear: academicYear.trim(),
      }
    : null;

  const reportId = student ? mengajiReportId(student.id ?? '', academicYear.trim(), semester) : '';
  const yearValid = /^\d{4}\/\d{4}$/.test(academicYear.trim());

  const load = async () => {
    if (!student || !yearValid) return;
    setLoadingReport(true);
    try {
      const data = await fetchMengajiReport(student.id ?? '', academicYear.trim(), semester);
      setReport(data);
      setSurat(data?.suratTargets ?? []);
      setHadits(data?.haditsTargets ?? []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat rapor mengaji');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, semester, academicYear, students.length]);

  const progressSorted = useMemo(() => sortProgressNewestFirst(report?.progress ?? []), [report]);
  const latest = progressSorted[0];

  const run = async (fn: () => Promise<void>, setBusy: (b: boolean) => void, ok: string, fail: string) => {
    setBusy(true);
    try {
      await fn();
      showToast('success', ok);
      await load();
    } catch (err) {
      console.error(err);
      showToast('error', fail);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveTargets = () => {
    if (!base) return;
    const clean = (list: HafalanTarget[]) => list.map(i => ({ ...i, name: i.name.trim() })).filter(i => i.name);
    run(() => saveHafalanTargets(base, clean(surat), clean(hadits)), setSavingTargets, 'Target hafalan tersimpan', 'Gagal menyimpan target hafalan');
  };

  const handleAddProgress = () => {
    if (!base) return;
    const halaman = Number(pHalaman);
    if (!pJilid.trim() || !Number.isFinite(halaman) || halaman < 1) {
      showToast('error', 'Isi jilid dan nomor halaman (angka mulai 1)');
      return;
    }
    run(
      async () => {
        await addMengajiProgress(base, { date: pDate, jilid: pJilid.trim(), halaman, teacherName: teacherName || currentUser?.email || 'Guru' });
        setPHalaman('');
      },
      setSavingProgress,
      'Progress mengaji tersimpan',
      'Gagal menyimpan progress'
    );
  };

  const handleAddNote = () => {
    if (!base || !noteText.trim()) return;
    run(
      async () => {
        await addMengajiNote(base, { message: noteText.trim(), teacherName: teacherName || currentUser?.email || 'Guru' });
        setNoteText('');
      },
      setSavingNote,
      'Catatan tersimpan',
      'Gagal menyimpan catatan'
    );
  };

  const handleRemove = async (kind: 'progress' | 'note', entryId: string) => {
    if (!window.confirm(kind === 'progress' ? 'Hapus catatan progress ini?' : 'Hapus catatan guru ini?')) return;
    try {
      await (kind === 'progress' ? removeMengajiProgress(reportId, entryId) : removeMengajiNote(reportId, entryId));
      await load();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menghapus');
    }
  };

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapor Mengaji</h1>
        <p className="text-sm text-slate-500">Target hafalan, progress jilid/halaman, dan catatan. Orang tua hanya melihat.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <select className="input md:flex-1" value={studentId} onChange={e => setStudentId(e.target.value)} disabled={studentsLoading}>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name} {s.nickname ? `(${getDisplayName(s)})` : ''} — {s.class}</option>
          ))}
        </select>
        <select className="input md:w-36" value={semester} onChange={e => setSemester(e.target.value as Semester)}>
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
        <input className="input md:w-36" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2026/2027" />
      </div>

      {student && !student.parentUid && (
        <div className="flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          Murid ini belum tertaut ke akun orang tua, jadi rapor mengaji belum akan tampil di akun orang tua. Minta admin menautkannya di Data Siswa.
        </div>
      )}
      {!yearValid && <p className="text-xs text-error-600">Tahun ajaran harus berformat 2026/2027.</p>}

      {loadingReport ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : (
        <>
          {/* Progress mengaji */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-1">Progress Mengaji</h2>
            {latest ? (
              <p className="text-sm text-slate-500 mb-4">
                Saat ini: <span className="font-semibold text-primary-700">{latest.jilid} · Halaman {latest.halaman}</span>{' '}
                (per {dayjs(latest.date).format('DD MMM YYYY')})
              </p>
            ) : (
              <p className="text-sm text-slate-400 mb-4">Belum ada progress tercatat semester ini.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <input type="date" className="input" value={pDate} max={dayjs().format('YYYY-MM-DD')} onChange={e => setPDate(e.target.value)} />
              <div>
                <input className="input" list="jilid-list" placeholder="Jilid" value={pJilid} onChange={e => setPJilid(e.target.value)} />
                <datalist id="jilid-list">{JILID_SUGGESTIONS.map(j => <option key={j} value={j} />)}</datalist>
              </div>
              <input type="number" min={1} className="input" placeholder="Halaman" value={pHalaman} onChange={e => setPHalaman(e.target.value)} />
              <button onClick={handleAddProgress} disabled={savingProgress} className="btn btn-primary flex items-center justify-center gap-2">
                {savingProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tambah
              </button>
            </div>

            {progressSorted.length > 0 && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {progressSorted.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <span className="text-xs text-slate-400 w-24 shrink-0">{dayjs(p.date).format('DD MMM YYYY')}</span>
                    <span className="flex-1 text-slate-700">{p.jilid} · Halaman {p.halaman}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">{p.teacherName}</span>
                    <button onClick={() => handleRemove('progress', p.id)} className="p-1 text-slate-400 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target hafalan */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold text-slate-900">Target Hafalan</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TargetEditor title="Target Hafalan Surat" items={surat} onChange={setSurat} suggestions={SURAH_SUGGESTIONS} listId="surah-list" placeholder="Nama surat" />
              <TargetEditor title="Target Hafalan Hadits" items={hadits} onChange={setHadits} listId="hadits-list" placeholder="Nama/judul hadits" />
            </div>
            <button onClick={handleSaveTargets} disabled={savingTargets} className="btn btn-primary mt-5 flex items-center gap-2">
              {savingTargets ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Target Hafalan
            </button>
          </div>

          {/* Catatan guru */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Catatan Guru</h2>
            <div className="flex gap-2 mb-4">
              <textarea className="input flex-1" rows={2} placeholder="Tulis catatan perkembangan mengaji..." value={noteText} onChange={e => setNoteText(e.target.value)} />
              <button onClick={handleAddNote} disabled={savingNote || !noteText.trim()} className="btn btn-primary px-3 self-end">
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {(report?.notes ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada catatan.</p>
            ) : (
              <div className="space-y-2">
                {[...(report?.notes ?? [])].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(n => (
                  <div key={n.id} className="rounded-xl border border-slate-100 p-3 flex gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 whitespace-pre-line">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.teacherName} · {dayjs(n.createdAt).format('DD MMM YYYY, HH:mm')}</p>
                    </div>
                    <button onClick={() => handleRemove('note', n.id)} className="p-1 text-slate-400 hover:text-error-600 self-start"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GuruMengaji;
