import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Loader2, Upload, Save, Trash2, FileCheck2, ExternalLink, NotebookText } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Student, getDisplayName } from '../../services/studentService';
import { Anecdote, fetchAnecdotes, createAnecdote, deleteAnecdote } from '../../services/anecdoteService';
import { uploadToDrive, UPLOAD_ACCEPT, buildFilePrefix } from '../../utils/upload';
import { getClassCode } from '../../config/classes';
import { getDriveImageUrl } from '../../utils/drive';

interface AnecdotePanelProps {
  students: Student[];
  studentId: string;
  onStudentChange: (id: string) => void;
  teacherName: string;
}

const today = () => dayjs().format('YYYY-MM-DD');
const label = 'block text-sm font-medium text-slate-700 mb-1';

// Tab "Anekdot" di Rekap Asesmen guru: form catatan + tabel riwayat
const AnecdotePanel = ({ students, studentId, onStudentChange, teacherName }: AnecdotePanelProps) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [date, setDate] = useState(today());
  const [detail, setDetail] = useState('');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [scope, setScope] = useState<'selected' | 'all'>('selected');
  const [rows, setRows] = useState<Anecdote[]>([]);
  const [loading, setLoading] = useState(true);

  const student = students.find(s => s.id === studentId);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchAnecdotes(scope === 'selected' && studentId ? studentId : undefined));
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat riwayat anekdot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, studentId]);

  const handleSave = async () => {
    if (!currentUser || !student) {
      showToast('error', 'Pilih murid terlebih dahulu');
      return;
    }
    if (!date || !detail.trim() || !place.trim() || !notes.trim()) {
      showToast('error', 'Tanggal, Detail Kejadian, Tempat, dan Keterangan wajib diisi');
      return;
    }

    setSaving(true);
    try {
      // Lampiran foto bersifat opsional
      let photoFileId: string | undefined;
      let photoWarning = '';
      if (photo) {
        try {
          const uploaded = await uploadToDrive(photo, 'assessment-kegiatan', {
            namePrefix: buildFilePrefix([getClassCode(student.class), 'ANEKDOT', date, student.nickname || student.name]),
          });
          photoFileId = uploaded.fileId;
        } catch (err) {
          photoWarning = err instanceof Error ? err.message : 'Foto gagal diunggah';
        }
      }

      await createAnecdote({
        studentId: student.id ?? '',
        studentName: student.name,
        parentUid: student.parentUid ?? '',
        class: student.class,
        date,
        detail: detail.trim(),
        place: place.trim(),
        notes: notes.trim(),
        photoFileId,
        teacherUid: currentUser.uid,
        teacherName: teacherName || currentUser.email || 'Guru',
      });

      if (photoWarning) {
        showToast('info', `Anekdot tersimpan tanpa foto: ${photoWarning}`);
      } else {
        showToast('success', `Anekdot ${student.nickname || student.name} tersimpan`);
      }
      setDetail('');
      setPlace('');
      setNotes('');
      setPhoto(null);
      setDate(today());
      await load();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menyimpan anekdot');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Anecdote) => {
    if (!window.confirm(`Hapus anekdot ${row.studentName} tanggal ${dayjs(row.date).format('DD/MM/YYYY')}?`)) return;
    try {
      await deleteAnecdote(row.id);
      setRows(prev => prev.filter(r => r.id !== row.id));
      showToast('success', 'Anekdot dihapus');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menghapus anekdot');
    }
  };

  return (
    <div className="space-y-6">
      {/* ---- Form ---- */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Tambah Anekdot</h2>
        <p className="text-xs text-slate-400 mb-4">Catatan ini hanya dilihat guru dan admin, tidak tampil di akun orang tua.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={label}>Nama Murid *</label>
            <select className="input" value={studentId} onChange={e => onStudentChange(e.target.value)}>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.nickname ? `(${getDisplayName(s)})` : ''} — {s.class}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Tanggal *</label>
            <input type="date" className="input" value={date} max={today()} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="md:col-span-3">
            <label className={label}>Detail Kejadian *</label>
            <textarea className="input" rows={3} value={detail} onChange={e => setDetail(e.target.value)} placeholder="Apa yang terjadi? Tulis kejadiannya secara rinci dan apa adanya." />
          </div>

          <div>
            <label className={label}>Tempat *</label>
            <input className="input" value={place} onChange={e => setPlace(e.target.value)} placeholder="Contoh: Halaman sekolah" />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Keterangan *</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Konteks atau tindak lanjut singkat" />
          </div>

          <div className="md:col-span-3">
            <label className={label}>
              Lampiran Foto <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
              {photo ? <FileCheck2 className="h-5 w-5 text-success-600" /> : <Upload className="h-5 w-5 text-slate-400" />}
              <span className="text-sm text-slate-500 truncate">{photo ? photo.name : 'Klik untuk memilih foto (boleh dikosongkan)'}</span>
              <input type="file" accept={UPLOAD_ACCEPT['assessment-kegiatan']} className="hidden" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            {photo && (
              <button onClick={() => setPhoto(null)} className="mt-1 text-xs text-slate-400 hover:text-error-600">Hapus lampiran</button>
            )}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !student} className="btn btn-primary mt-5 flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Anekdot
        </button>
      </div>

      {/* ---- Riwayat (tabel) ---- */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-900">Riwayat Anekdot</h2>
          <select className="input sm:w-64" value={scope} onChange={e => setScope(e.target.value as 'selected' | 'all')}>
            <option value="selected">Murid terpilih{student ? `: ${getDisplayName(student)}` : ''}</option>
            <option value="all">Semua murid</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary-500" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10">
            <NotebookText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Belum ada anekdot</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">Tanggal</th>
                  <th>Nama Murid</th>
                  <th>Detail Kejadian</th>
                  <th>Tempat</th>
                  <th>Keterangan</th>
                  <th>Foto</th>
                  <th>Guru</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap">{dayjs(row.date).locale('id').format('DD MMM YYYY')}</td>
                    <td>
                      <div className="font-medium text-slate-900">{row.studentName}</div>
                      <div className="text-xs text-slate-400">{row.class}</div>
                    </td>
                    <td className="min-w-[220px] whitespace-pre-line">{row.detail}</td>
                    <td>{row.place}</td>
                    <td className="min-w-[160px]">{row.notes}</td>
                    <td>
                      {row.photoFileId ? (
                        <a href={`https://drive.google.com/file/d/${row.photoFileId}/view`} target="_blank" rel="noreferrer" className="group relative inline-block" title="Buka foto">
                          <img src={getDriveImageUrl(row.photoFileId)} alt="Lampiran" className="h-12 w-12 rounded-lg object-cover border border-slate-100" loading="lazy" />
                          <ExternalLink className="absolute right-0.5 bottom-0.5 h-3.5 w-3.5 rounded bg-white/90 p-0.5 text-slate-500 opacity-0 group-hover:opacity-100" />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-500">{row.teacherName}</td>
                    <td>
                      <button onClick={() => handleDelete(row)} className="p-1.5 text-slate-400 hover:text-error-600" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnecdotePanel;
