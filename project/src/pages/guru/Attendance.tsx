import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CheckCircle2, Loader2, Save, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useStudents } from '../../hooks/useStudents';
import { getDisplayName } from '../../services/studentService';
import { CLASS_OPTIONS } from '../../config/classes';
import {
  AttendanceStatus,
  ATTENDANCE_LABEL,
  fetchAttendanceSession,
  saveAttendanceSession,
} from '../../services/attendanceService';

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  hadir: 'bg-success-100 text-success-700 border-success-200',
  sakit: 'bg-accent-100 text-accent-800 border-accent-200',
  izin: 'bg-primary-100 text-primary-700 border-primary-200',
  alpa: 'bg-error-100 text-error-700 border-error-200',
};

const GuruAttendance = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [className, setClassName] = useState<string>(CLASS_OPTIONS[0]);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);

  const { students, loading: studentsLoading } = useStudents({ className, onlyActive: true });

  // Muat absensi yang sudah tersimpan untuk kelas & tanggal ini (kalau ada),
  // selain itu semua murid di-default "Hadir" supaya guru tinggal koreksi yang tidak hadir.
  useEffect(() => {
    const load = async () => {
      setLoadingSession(true);
      try {
        const session = await fetchAttendanceSession(className, new Date(date));
        const defaults: Record<string, AttendanceStatus> = {};
        students.forEach(s => {
          defaults[s.id ?? ''] = session?.records[s.id ?? ''] ?? 'hadir';
        });
        setRecords(defaults);
      } catch (err) {
        console.error('Gagal memuat absensi:', err);
        showToast('error', 'Gagal memuat data absensi sebelumnya');
      } finally {
        setLoadingSession(false);
      }
    };
    if (!studentsLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className, date, studentsLoading, students.length]);

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    Object.values(records).forEach(status => { counts[status] += 1; });
    return counts;
  }, [records]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await saveAttendanceSession(className, new Date(date), records, currentUser.uid);
      showToast('success', `Absensi ${className} tanggal ${dayjs(date).format('DD MMM YYYY')} tersimpan`);
    } catch (err) {
      console.error('Gagal menyimpan absensi:', err);
      showToast('error', 'Gagal menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rekap Absensi</h1>
        <p className="text-sm text-slate-500">Centang kehadiran murid per hari</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select className="input sm:w-56" value={className} onChange={e => setClassName(e.target.value)}>
          {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          className="input sm:w-48"
          value={date}
          max={dayjs().format('YYYY-MM-DD')}
          onChange={e => setDate(e.target.value)}
        />
        <div className="flex-1" />
        <button onClick={handleSave} disabled={saving || loadingSession} className="btn btn-primary flex items-center justify-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Absensi
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(Object.keys(ATTENDANCE_LABEL) as AttendanceStatus[]).map(status => (
          <div key={status} className={`rounded-2xl border p-3 text-center ${STATUS_STYLE[status]}`}>
            <p className="text-2xl font-bold">{summary[status]}</p>
            <p className="text-xs font-medium">{ATTENDANCE_LABEL[status]}</p>
          </div>
        ))}
      </div>

      {studentsLoading || loadingSession ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-slate-500">Memuat data...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="card p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">Belum ada murid aktif di kelas {className}</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {students.map(s => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-900">{s.name}</p>
                {s.nickname && <p className="text-xs text-slate-400">Panggilan: {getDisplayName(s)}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(ATTENDANCE_LABEL) as AttendanceStatus[]).map(status => {
                  const active = records[s.id ?? ''] === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setRecords(prev => ({ ...prev, [s.id ?? '']: status }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        active ? STATUS_STYLE[status] : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {ATTENDANCE_LABEL[status]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuruAttendance;
