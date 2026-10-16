import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { doc, getDoc } from 'firebase/firestore';
import {
  Loader2,
  FileUp,
  FileCheck2,
  Save,
  Trash2,
  ChevronDown,
  AlertTriangle,
  ExternalLink,
  CalendarRange,
  Info,
} from 'lucide-react';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { CLASS_OPTIONS, getClassCode } from '../../../config/classes';
import { getCurrentAcademicYear, getCurrentSemester, Semester } from '../../../services/studentService';
import {
  WeeklyPlan,
  WeeklyPlanDay,
  fetchWeeklyPlans,
  saveWeeklyPlans,
  deleteWeeklyPlan,
} from '../../../services/weeklyPlanService';
import { parseModulAjar, ParsedModulAjar } from '../../../utils/modulAjarParser';
import { uploadToDrive, UPLOAD_ACCEPT, buildFilePrefix } from '../../../utils/upload';
import { getDomainBadgeClass } from '../../../utils/domainStyle';

const formatDate = (key: string) => dayjs(key).locale('id').format('dddd, DD MMM YYYY');
const formatShort = (key: string) => dayjs(key).locale('id').format('DD MMM YYYY');
const timeLabel = (start?: string, end?: string) => (start && end ? `${start.replace(':', '.')}–${end.replace(':', '.')}` : '');

const DaysPreview = ({ days }: { days: WeeklyPlanDay[] }) => (
  <div className="space-y-3">
    {days.map(day => (
      <div key={day.date} className="rounded-xl border border-slate-100 p-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-slate-900">{formatDate(day.date)}</p>
          {timeLabel(day.intiStart, day.intiEnd) && (
            <span className="badge badge-primary">Inti {timeLabel(day.intiStart, day.intiEnd)}</span>
          )}
        </div>
        {day.subSubTheme && <p className="text-xs text-slate-500 mb-2">Sub-sub tema: {day.subSubTheme}</p>}
        {day.activities.length === 0 ? (
          <p className="text-xs text-error-600">Kegiatan inti tidak terbaca</p>
        ) : (
          <ul className="space-y-1.5">
            {day.activities.map((a, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${getDomainBadgeClass(a.domain)}`}>
                  {a.domain}
                </span>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    ))}
  </div>
);

const WeeklyPlans = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [adminName, setAdminName] = useState('');

  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ---- state unggah ----
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsed, setParsed] = useState<ParsedModulAjar | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [semester, setSemester] = useState<Semester>(getCurrentSemester());
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadName = async () => {
      if (!currentUser) return;
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) setAdminName(snap.data().name || '');
    };
    loadName();
  }, [currentUser]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      setPlans(await fetchWeeklyPlans());
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat daftar modul ajar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetUpload = () => {
    setFile(null);
    setParsed(null);
    setParseError('');
    setSelectedClasses([]);
  };

  const handleFileChosen = async (chosen: File | null) => {
    resetUpload();
    if (!chosen) return;
    setFile(chosen);
    setParsing(true);
    try {
      const result = await parseModulAjar(await chosen.arrayBuffer());
      setParsed(result);
      if (result.semester) setSemester(result.semester);
      if (result.academicYear) setAcademicYear(result.academicYear);
      // Saran kelas dari isi dokumen: "Kelompok A" + "reguler"/"fullday"
      if (result.group) {
        setSelectedClasses(
          CLASS_OPTIONS.filter(c => c.startsWith(`TK ${result.group}`) && (!result.program || c.endsWith(result.program)))
        );
      }
    } catch (err) {
      console.error(err);
      setParseError(err instanceof Error ? err.message : 'File tidak dapat dibaca');
    } finally {
      setParsing(false);
    }
  };

  const toggleClass = (className: string) =>
    setSelectedClasses(prev => (prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]));

  const handleSave = async () => {
    if (!parsed || !file) return;
    if (selectedClasses.length === 0) {
      showToast('error', 'Pilih minimal satu kelas');
      return;
    }
    if (!/^\d{4}\/\d{4}$/.test(academicYear.trim())) {
      showToast('error', 'Tahun ajaran harus berformat 2026/2027');
      return;
    }

    setSaving(true);
    try {
      // 1) Arsipkan file asli ke Google Drive (opsional: kegagalan tidak membatalkan jadwal)
      let fileId: string | undefined;
      let fileName: string | undefined;
      let archiveError = '';
      try {
        const uploaded = await uploadToDrive(file, 'modul-ajar', {
          namePrefix: buildFilePrefix([...selectedClasses.map(getClassCode), 'MODULAJAR', parsed.startDate]),
        });
        fileId = uploaded.fileId;
        fileName = uploaded.fileName;
      } catch (err) {
        archiveError = err instanceof Error ? err.message : 'Upload ke Drive gagal';
      }

      // 2) Simpan hasil bacaan (inilah yang dipakai Beranda Guru)
      await saveWeeklyPlans({
        parsed,
        classNames: selectedClasses,
        semester,
        academicYear: academicYear.trim(),
        fileId,
        fileName,
        uploadedByName: adminName || currentUser?.email || 'Admin',
      });

      if (archiveError) {
        showToast('info', `Kegiatan inti tersimpan, tetapi file asli belum terarsip di Drive: ${archiveError}`);
      } else {
        showToast('success', 'Modul ajar tersimpan. Kegiatan inti otomatis tampil di Beranda Guru.');
      }
      resetUpload();
      await loadPlans();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menyimpan modul ajar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: WeeklyPlan) => {
    if (!window.confirm(`Hapus modul ajar ${plan.className} (${formatShort(plan.startDate)})? Kegiatan inti minggu itu hilang dari Beranda Guru.`)) return;
    try {
      await deleteWeeklyPlan(plan.id);
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      showToast('success', 'Modul ajar dihapus');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menghapus modul ajar');
    }
  };

  const hasPlanOverlap = useMemo(
    () =>
      parsed
        ? plans.filter(p => p.startDate === parsed.startDate && selectedClasses.includes(p.className)).map(p => p.className)
        : [],
    [plans, parsed, selectedClasses]
  );

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modul Ajar Mingguan</h1>
        <p className="text-sm text-slate-500">
          Unggah Modul Ajar (.docx), kegiatan inti tiap hari terbaca otomatis dan tampil di Beranda Guru
        </p>
      </div>

      {/* ============ UNGGAH ============ */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Unggah Modul Ajar Baru</h2>

        <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-5 cursor-pointer hover:bg-slate-50">
          {file ? <FileCheck2 className="h-5 w-5 text-success-600" /> : <FileUp className="h-5 w-5 text-slate-400" />}
          <span className="text-sm text-slate-500 truncate">{file ? file.name : 'Klik untuk memilih file Modul Ajar (.docx)'}</span>
          <input
            type="file"
            accept={UPLOAD_ACCEPT['modul-ajar']}
            className="hidden"
            onChange={e => handleFileChosen(e.target.files?.[0] ?? null)}
          />
        </label>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Pakai template Modul Ajar TK An Nuur (tabel "C. Pengalaman Belajar" dengan baris Awal/Inti/Istirahat/Penutup). Maksimal 4 MB.
        </p>

        {parsing && (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-primary-500" /> Membaca isi modul ajar...
          </div>
        )}

        {parseError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {parseError}
          </div>
        )}

        {parsed && (
          <div className="mt-5 space-y-5">
            {/* Ringkasan hasil bacaan */}
            <div className="rounded-xl bg-primary-50 border border-primary-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 mb-1">Hasil bacaan otomatis</p>
              <p className="text-base font-semibold text-slate-900">{parsed.tema || '(tema tidak terbaca)'}</p>
              {parsed.subTema && <p className="text-sm text-slate-600">Sub tema: {parsed.subTema}</p>}
              <p className="text-xs text-slate-500 mt-1">
                {parsed.weekNumber ? `Minggu ke-${parsed.weekNumber} · ` : ''}
                {formatShort(parsed.startDate)} – {formatShort(parsed.endDate)} · {parsed.days.length} hari
              </p>
            </div>

            {parsed.warnings.length > 0 && (
              <div className="rounded-xl border border-accent-200 bg-accent-50 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-800 mb-1">
                  <AlertTriangle className="h-4 w-4" /> Perlu dicek
                </p>
                <ul className="list-disc pl-5 text-xs text-accent-800 space-y-0.5">
                  {parsed.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {/* Kelas, semester, tahun ajaran */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <p className="block text-sm font-medium text-slate-700 mb-1">Berlaku untuk kelas *</p>
                <div className="space-y-1.5">
                  {CLASS_OPTIONS.map(c => (
                    <label key={c} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={selectedClasses.includes(c)} onChange={() => toggleClass(c)} />
                      {c}
                    </label>
                  ))}
                </div>
                {!parsed.group && (
                  <p className="mt-1 text-xs text-slate-400">Kelompok tidak terbaca dari dokumen, pilih manual.</p>
                )}
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

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Kegiatan inti per hari (ini yang akan tampil di Guru)</p>
              <DaysPreview days={parsed.days} />
            </div>

            {hasPlanOverlap.length > 0 && (
              <p className="flex items-start gap-1.5 text-xs text-accent-800">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Minggu ini sudah ada untuk {hasPlanOverlap.join(', ')}; menyimpan akan menimpanya.
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan & Tampilkan di Guru
              </button>
              <button onClick={resetUpload} disabled={saving} className="btn btn-secondary">Batal</button>
            </div>
          </div>
        )}
      </div>

      {/* ============ DAFTAR TERSIMPAN ============ */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Modul Ajar Tersimpan</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary-500" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8">
            <CalendarRange className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Belum ada modul ajar yang diunggah</p>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map(plan => (
              <div key={plan.id} className="rounded-xl border border-slate-100">
                <div className="flex items-center gap-3 p-3">
                  <button onClick={() => setExpanded(expanded === plan.id ? null : plan.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded === plan.id ? 'rotate-180' : ''}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {formatShort(plan.startDate)} – {formatShort(plan.endDate)} · {plan.tema}
                      </p>
                      <p className="text-xs text-slate-400">
                        {plan.weekNumber ? `Minggu ke-${plan.weekNumber} · ` : ''}{plan.days.length} hari · diunggah {plan.uploadedByName}
                      </p>
                    </div>
                  </button>
                  <span className="badge badge-primary shrink-0">{plan.className}</span>
                  {plan.fileId && (
                    <a href={`https://drive.google.com/file/d/${plan.fileId}/view`} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-primary-600" title="Buka file asli di Drive">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(plan)} className="p-1.5 text-slate-400 hover:text-error-600" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {expanded === plan.id && (
                  <div className="border-t border-slate-100 p-3">
                    <DaysPreview days={plan.days} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyPlans;
