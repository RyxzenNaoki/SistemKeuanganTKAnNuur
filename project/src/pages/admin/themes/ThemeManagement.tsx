import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Save, BookOpenText } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { getCurrentAcademicYear, getCurrentSemester, Semester } from '../../../services/studentService';
import {
  Theme,
  fetchThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  getSemesterWeekNumber,
} from '../../../services/curriculumService';

const ThemeManagement = () => {
  const { showToast } = useToast();
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [semester, setSemester] = useState<Semester>(getCurrentSemester());
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subTheme, setSubTheme] = useState('');
  const [weekNumber, setWeekNumber] = useState('');

  const currentWeek = getSemesterWeekNumber();

  const load = async () => {
    setLoading(true);
    try {
      setThemes(await fetchThemes(academicYear, semester));
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat tema pembelajaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, semester]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSubTheme('');
    setWeekNumber('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('error', 'Nama tema wajib diisi');
      return;
    }
    const week = weekNumber.trim() ? Number(weekNumber) : undefined;
    if (week !== undefined && (!Number.isInteger(week) || week < 1)) {
      showToast('error', 'Minggu ke- harus berupa angka bulat mulai 1');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), subTheme: subTheme.trim() || undefined, weekNumber: week, semester, academicYear };
      if (editingId) {
        await updateTheme(editingId, payload);
        showToast('success', 'Tema diperbarui');
      } else {
        await createTheme(payload);
        showToast('success', 'Tema ditambahkan');
      }
      resetForm();
      await load();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menyimpan tema');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (theme: Theme) => {
    setEditingId(theme.id);
    setName(theme.name);
    setSubTheme(theme.subTheme ?? '');
    setWeekNumber(theme.weekNumber ? String(theme.weekNumber) : '');
  };

  const handleDelete = async (theme: Theme) => {
    if (!window.confirm(`Hapus tema "${theme.name}"? Asesmen yang sudah memakai tema ini tidak ikut terhapus.`)) return;
    try {
      await deleteTheme(theme.id);
      setThemes(prev => prev.filter(t => t.id !== theme.id));
      showToast('success', 'Tema dihapus');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal menghapus tema');
    }
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tema Pembelajaran</h1>
        <p className="text-sm text-slate-500">
          Tema per semester untuk Asesmen Hasil Karya (guru) dan Rapor Digital (orang tua)
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input className="input sm:w-40" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2026/2027" />
        <select className="input sm:w-40" value={semester} onChange={e => setSemester(e.target.value as Semester)}>
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
        <p className="text-xs text-slate-400 self-center">Minggu berjalan perkiraan: ke-{currentWeek}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-1 h-fit">
          <h2 className="font-semibold text-slate-900 mb-4">{editingId ? 'Edit Tema' : 'Tambah Tema'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Tema *</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Tanaman" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sub Tema</label>
              <input className="input" value={subTheme} onChange={e => setSubTheme(e.target.value)} placeholder="Contoh: Bagian-bagian tanaman" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minggu ke-</label>
              <input className="input" type="number" min={1} value={weekNumber} onChange={e => setWeekNumber(e.target.value)} placeholder="Opsional, untuk Beranda Guru" />
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
          <h2 className="font-semibold text-slate-900 mb-4">Daftar Tema — {semester} {academicYear}</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary-500" /></div>
          ) : themes.length === 0 ? (
            <div className="text-center py-10">
              <BookOpenText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Belum ada tema untuk semester ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {themes.map(theme => (
                <div key={theme.id} className={`flex items-center gap-3 rounded-xl border p-3 ${theme.weekNumber === currentWeek ? 'border-accent-300 bg-accent-50' : 'border-slate-100'}`}>
                  <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-semibold text-primary-700">
                    {theme.weekNumber ? `Mgg ${theme.weekNumber}` : '—'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{theme.name}</p>
                    {theme.subTheme && <p className="text-xs text-slate-500">{theme.subTheme}</p>}
                  </div>
                  <button onClick={() => handleEdit(theme)} className="p-1.5 text-slate-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(theme)} className="p-1.5 text-slate-400 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeManagement;
