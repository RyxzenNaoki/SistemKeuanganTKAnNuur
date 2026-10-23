import { Plus, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import type { WeeklyPlanDay } from '../../services/weeklyPlanService';
import { getDomainBadgeClass } from '../../utils/domainStyle';

// Bagian Modul Ajar yang boleh diedit admin. Tanggal sengaja tidak bisa diubah
// (dipakai sebagai kunci jadwal) — kalau tanggalnya salah, unggah ulang file yang benar.
export interface EditablePlan {
  tema: string;
  subTema: string;
  weekNumber?: number;
  days: WeeklyPlanDay[];
}

const DOMAIN_SUGGESTIONS = ['Kognitif', 'Bahasa', 'Motorik', 'Seni', 'Sosial Emosional', 'Nilai Agama dan Budi Pekerti'];

interface PlanEditorProps {
  value: EditablePlan;
  onChange: (next: EditablePlan) => void;
}

const PlanEditor = ({ value, onChange }: PlanEditorProps) => {
  const setDay = (index: number, patch: Partial<WeeklyPlanDay>) =>
    onChange({ ...value, days: value.days.map((d, i) => (i === index ? { ...d, ...patch } : d)) });

  const setActivity = (dayIdx: number, actIdx: number, patch: Partial<{ domain: string; text: string }>) =>
    setDay(dayIdx, {
      activities: value.days[dayIdx].activities.map((a, i) => (i === actIdx ? { ...a, ...patch } : a)),
    });

  return (
    <div className="space-y-5">
      <datalist id="domain-suggestions">
        {DOMAIN_SUGGESTIONS.map(d => <option key={d} value={d} />)}
      </datalist>

      {/* Tema */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Tema *</label>
          <input className="input" value={value.tema} onChange={e => onChange({ ...value, tema: e.target.value })} />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">Sub Tema</label>
          <input className="input" value={value.subTema} onChange={e => onChange({ ...value, subTema: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Minggu ke-</label>
          <input
            type="number"
            min={1}
            className="input"
            value={value.weekNumber ?? ''}
            onChange={e => onChange({ ...value, weekNumber: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      {/* Hari */}
      <div className="space-y-4">
        {value.days.map((day, dayIdx) => (
          <div key={day.date} className="rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              {dayjs(day.date).locale('id').format('dddd, DD MMMM YYYY')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Sub-sub tema hari ini</label>
                <input
                  className="input"
                  value={day.subSubTheme ?? ''}
                  onChange={e => setDay(dayIdx, { subSubTheme: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Inti mulai</label>
                <input type="time" className="input" value={day.intiStart ?? ''} onChange={e => setDay(dayIdx, { intiStart: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Inti selesai</label>
                <input type="time" className="input" value={day.intiEnd ?? ''} onChange={e => setDay(dayIdx, { intiEnd: e.target.value })} />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 mb-2">Kegiatan inti</p>
            <div className="space-y-2">
              {day.activities.map((activity, actIdx) => (
                <div key={actIdx} className="flex gap-2 items-start">
                  <input
                    list="domain-suggestions"
                    className={`input w-36 shrink-0 font-semibold ${getDomainBadgeClass(activity.domain)}`}
                    value={activity.domain}
                    placeholder="Bidang"
                    onChange={e => setActivity(dayIdx, actIdx, { domain: e.target.value })}
                  />
                  <textarea
                    className="input flex-1"
                    rows={1}
                    value={activity.text}
                    placeholder="Kegiatan"
                    onChange={e => setActivity(dayIdx, actIdx, { text: e.target.value })}
                  />
                  <button
                    onClick={() => setDay(dayIdx, { activities: day.activities.filter((_, i) => i !== actIdx) })}
                    className="p-2 text-slate-400 hover:text-error-600"
                    title="Hapus kegiatan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setDay(dayIdx, { activities: [...day.activities, { domain: '', text: '' }] })}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" /> Tambah kegiatan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanEditor;
