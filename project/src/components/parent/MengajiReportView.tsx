import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { BookOpen, Check, Clock, Circle, TrendingUp, NotebookPen } from 'lucide-react';
import {
  MengajiReport,
  HafalanTarget,
  HafalanStatus,
  HAFALAN_LABEL,
  sortProgressNewestFirst,
} from '../../services/mengajiService';

const STATUS_BADGE: Record<HafalanStatus, string> = {
  belum: 'bg-slate-100 text-slate-500',
  proses: 'bg-accent-100 text-accent-800',
  hafal: 'bg-success-100 text-success-700',
};

const STATUS_ICON: Record<HafalanStatus, typeof Check> = {
  belum: Circle,
  proses: Clock,
  hafal: Check,
};

const TargetList = ({ title, items }: { title: string; items: HafalanTarget[] }) => {
  const done = items.filter(i => i.status === 'hafal').length;
  const percent = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{done}/{items.length} hafal</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary-300 to-success-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada target.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => {
            const Icon = STATUS_ICON[item.status];
            return (
              <li key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2">
                <span className="text-sm text-slate-800">{item.name}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                  <Icon className="h-3 w-3" />
                  {HAFALAN_LABEL[item.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// Rapor Mengaji untuk Orang Tua — hanya membaca; data diinput guru
const MengajiReportView = ({ reports }: { reports: MengajiReport[] }) => {
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (reports.length > 0 && !reports.some(r => r.id === selectedId)) setSelectedId(reports[0].id);
  }, [reports, selectedId]);

  if (reports.length === 0) {
    return (
      <div className="card p-10 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <p className="text-slate-500 text-sm">Belum ada rapor mengaji yang diinput guru.</p>
      </div>
    );
  }

  const report = reports.find(r => r.id === selectedId) ?? reports[0];
  const progress = sortProgressNewestFirst(report.progress);
  const latest = progress[0];
  const notes = [...report.notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-5">
      {reports.length > 1 && (
        <select className="input max-w-xs" value={report.id} onChange={e => setSelectedId(e.target.value)}>
          {reports.map(r => (
            <option key={r.id} value={r.id}>Semester {r.semester} {r.academicYear}</option>
          ))}
        </select>
      )}

      {/* Progress terkini */}
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Progress Mengaji · Semester {report.semester} {report.academicYear}</p>
            {latest ? (
              <>
                <p className="text-xl font-bold text-slate-900">{latest.jilid} · Halaman {latest.halaman}</p>
                <p className="text-xs text-slate-500">Diperbarui {dayjs(latest.date).format('DD MMM YYYY')} oleh {latest.teacherName || 'guru'}</p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Belum ada progress tercatat.</p>
            )}
          </div>
        </div>

        {progress.length > 1 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-500 mb-2">Riwayat</p>
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {progress.map(p => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.jilid} · Halaman {p.halaman}</span>
                  <span className="text-xs text-slate-400">{dayjs(p.date).format('DD MMM YYYY')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TargetList title="Target Hafalan Surat" items={report.suratTargets} />
        <TargetList title="Target Hafalan Hadits" items={report.haditsTargets} />
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <NotebookPen className="h-5 w-5 text-secondary-500" />
          <h3 className="font-semibold text-slate-900">Catatan Guru</h3>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada catatan.</p>
        ) : (
          <div className="space-y-3">
            {notes.map(n => (
              <div key={n.id} className="rounded-xl border border-slate-100 p-3">
                <p className="text-sm text-slate-700 whitespace-pre-line">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{n.teacherName || 'Guru'} · {dayjs(n.createdAt).format('DD MMM YYYY, HH:mm')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MengajiReportView;
