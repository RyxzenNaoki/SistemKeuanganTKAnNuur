import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: ReactNode;
  points?: string[];
}

// Kerangka halaman yang fiturnya dibangun di tahap berikutnya
const ComingSoon = ({ title, description, icon, points = [] }: ComingSoonProps) => (
  <div className="page-transition">
    <h1 className="text-2xl font-bold mb-1">{title}</h1>
    <p className="text-sm text-slate-500 mb-6">{description}</p>

    <div className="card p-8 text-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
        {icon ?? <Sparkles className="h-7 w-7" />}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Segera hadir</h2>
      <p className="mt-1 text-sm text-slate-500">Halaman ini sedang disiapkan.</p>
      {points.length > 0 && (
        <ul className="mx-auto mt-5 max-w-md space-y-2 text-left text-sm text-slate-600">
          {points.map(point => (
            <li key={point} className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 shadow-soft">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default ComingSoon;
