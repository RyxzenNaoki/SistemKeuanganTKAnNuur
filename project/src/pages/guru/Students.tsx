import { useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { getCurrentAcademicYear, getDisplayName } from '../../services/studentService';

const GuruStudents = () => {
  const { students, loading, error } = useStudents({ onlyActive: true });
  const [search, setSearch] = useState('');
  const [className, setClassName] = useState('all');
  const [year, setYear] = useState(getCurrentAcademicYear());

  const classOptions = useMemo(
    () => Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort(),
    [students]
  );
  const yearOptions = useMemo(
    () => Array.from(new Set([getCurrentAcademicYear(), ...students.map(s => s.academicYear).filter(Boolean)])).sort().reverse(),
    [students]
  );

  const filtered = students.filter(s => {
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      (s.nickname || '').toLowerCase().includes(term) ||
      s.parentName.toLowerCase().includes(term);
    const matchClass = className === 'all' || s.class === className;
    const matchYear = year === 'all' || s.academicYear === year;
    return matchSearch && matchClass && matchYear;
  });

  const semester = new Date().getMonth() >= 6 ? 'Ganjil' : 'Genap';

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Data Siswa Semester Ini</h1>
        <p className="text-sm text-slate-500">
          Semester {semester} · {filtered.length} murid ditampilkan
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Cari nama murid atau orang tua..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input md:w-44" value={className} onChange={e => setClassName(e.target.value)}>
          <option value="all">Semua Kelas</option>
          {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input md:w-44" value={year} onChange={e => setYear(e.target.value)}>
          <option value="all">Semua Tahun Ajaran</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-slate-500">Memuat data siswa...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-error-600 text-sm">{error}</div>
      ) : (
        <div className="table-container bg-white">
          <table className="table">
            <thead>
              <tr>
                <th>Murid</th>
                <th>Kelas</th>
                <th>Tahun Ajaran</th>
                <th>Orang Tua</th>
                <th>Status Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8">
                    Tidak ada murid yang cocok
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-medium text-slate-900">{s.name}</div>
                      {s.nickname && (
                        <div className="text-xs text-slate-400">Panggilan: {getDisplayName(s)}</div>
                      )}
                    </td>
                    <td><span className="badge badge-primary">{s.class}</span></td>
                    <td>{s.academicYear}</td>
                    <td>{s.parentName || '-'}</td>
                    <td>
                      {s.verified === false ? (
                        <span className="badge badge-accent">Belum diverifikasi</span>
                      ) : (
                        <span className="badge badge-success">Terverifikasi</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GuruStudents;
