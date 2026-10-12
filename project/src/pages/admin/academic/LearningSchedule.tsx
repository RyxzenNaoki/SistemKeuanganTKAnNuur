import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Save, CalendarClock } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { CLASS_OPTIONS } from '../../../config/classes';
import {
  ALL_CLASSES,
  SCHOOL_DAYS,
  ScheduleItem,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getDaySchedule,
} from '../../../services/scheduleService';

const CLASS_CHOICES = [ALL_CLASSES, ...CLASS_OPTIONS];

const LearningSchedule = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [viewClass, setViewClass] = useState<string>(CLASS_OPTIONS[0]);
  const [viewDay, setViewDay] = useState<number>(Math.min(Math.max(new Date().getDay(), 1), 5));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formClass, setFormClass] = useState<string>(ALL_CLASSES);
  const [formDay, setFormDay] = useState<number>(1);
  const [allDays, setAllDays] = useState(false);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('08:00');
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchSchedules());
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat jadwal pembelajaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setAllDays(false);
    setActivity('');
    setNotes('');
  };

  const shown =
    viewClass === ALL_CLASSES
      ? items.filter(i => i.day === viewDay && i.className === ALL_CLASSES)
      : getDaySchedule(items, viewClass, viewDay);

  const handleSave = async () => {
    if (!activity.trim()) {
      showToast('error', 'Nama kegiatan wajib diisi');
      return;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      showToast('error', 'Jam selesai harus setelah jam mulai');
      return;
    }
    setSaving(true);
    try {
      const base = {
        className: formClass,
        startTime,
        endTime,
        activity: activity.trim(),
        notes: notes.trim() || undefined,
      };
      if (editingId) {
        await updateSchedule(editingId, { ...base, day: formDay });
        showToast('success', 'Jadwal diperbarui');
      } else {
        const days = allDays ? SCHOOL_DAYS.map(d => d.value) : [formDay];
        await Promise.all(days.map(day => createSchedule({ ...base, day })));
        showToast('success', allDays ? 'Kegiatan ditambahkan untuk Senin–Jumat' : 'Kegiatan ditambahkan');
      }
      resetForm();
      await load();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setFormClass(item.className);
    setFormDay(item.day);
    setAllDays(false);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setActivity(item.activity);
    setNotes(item.notes ?? '');
  };

  const handleDelete = async (item: ScheduleItem) => {
    if (!window.confirm(`Hapus kegiatan "${item.activity}"?`)) return;
    try {
      await deleteSchedule(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast('success', 'Kegiatan dihapus');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menghapus kegiatan');
    }
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jadwal Pembelajaran</h1>
        <p className="text-sm text-slate-500">Jadwal kegiatan harian yang tampil di Beranda Guru (Senin–Jumat)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-1 h-fit">
          <h2 className="font-semibold text-slate-900 mb-4">{editingId ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Untuk Kelas</label>
              <select className="input" value={formClass} onChange={e => setFormClass(e.target.value)}>
                {CLASS_CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
              <select className="input" value={formDay} onChange={e => setFormDay(Number(e.target.value))} disabled={allDays && !editingId}>
                {SCHOOL_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              {!editingId && (
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={allDays} onChange={e => setAllDays(e.target.checked)} />
                  Berlaku setiap hari (Senin–Jumat)
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mulai</label>
                <input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selesai</label>
                <input type="time" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kegiatan *</label>
              <input className="input" value={activity} onChange={e => setActivity(e.target.value)} placeholder="Contoh: Kegiatan inti / Makan sehat" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Simpan' : 'Tambah'}
              </button>
              {editingId && (
                <button onClick={resetForm} className="btn btn-secondary px-3"><X className="h-4 w-4" /></button>
              )}
            </div>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select className="input sm:w-56" value={viewClass} onChange={e => setViewClass(e.target.value)}>
              {CLASS_CHOICES.map(c => <option key={c} value={c}>{c === ALL_CLASSES ? 'Hanya yang untuk Semua Kelas' : c}</option>)}
            </select>
            <div className="flex gap-1.5 flex-wrap">
              {SCHOOL_DAYS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setViewDay(d.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    viewDay === d.value ? 'bg-primary-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary-500" /></div>
          ) : shown.length === 0 ? (
            <div className="text-center py-10">
              <CalendarClock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Belum ada kegiatan di hari ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shown.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="shrink-0 rounded-lg bg-primary-100 px-2.5 py-1.5 text-xs font-semibold text-primary-700">
                    {item.startTime} – {item.endTime}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.activity}</p>
                    <p className="text-xs text-slate-400">
                      {item.className === ALL_CLASSES ? 'Semua kelas' : item.className}
                      {item.notes ? ` · ${item.notes}` : ''}
                    </p>
                  </div>
                  <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(item)} className="p-1.5 text-slate-400 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningSchedule;
