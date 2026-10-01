import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Image as ImageIcon,
  Sparkles,
  NotebookPen,
  FileText,
  Loader2,
  Send,
  Download,
  ChevronDown,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useParentStudents } from '../../hooks/useStudents';
import {
  fetchAssessmentsByStudent,
  addParentFeedback,
  AssessmentEntry,
  AssessmentCategory,
} from '../../services/assessmentService';
import { fetchReportCardsByStudent, ReportCard } from '../../services/reportCardService';
import { getDriveImageUrl, getDrivePreviewUrl, getDriveDownloadUrl } from '../../utils/drive';

type TabKey = 'karya' | 'kegiatan' | 'catatan' | 'pdf';

const TABS: { key: TabKey; label: string; icon: typeof ImageIcon; desc: string }[] = [
  { key: 'karya', label: 'Foto Progress Hasil Karya', icon: Sparkles, desc: 'Dikelompokkan per tema pembelajaran & semester' },
  { key: 'kegiatan', label: 'Foto Kegiatan Sekolah', icon: ImageIcon, desc: 'Dokumentasi kegiatan anak di sekolah' },
  { key: 'catatan', label: 'Catatan Guru', icon: NotebookPen, desc: 'Catatan selama proses pembelajaran, bisa dibalas' },
  { key: 'pdf', label: 'File PDF Rapor', icon: FileText, desc: 'Rapor resmi per semester' },
];

const DigitalReport = () => {
  const { student, loading: studentLoading } = useParentStudents();
  const params = useParams<{ tab?: string }>();
  const activeTab: TabKey = (['karya', 'kegiatan', 'catatan', 'pdf'] as TabKey[]).includes(params.tab as TabKey)
    ? (params.tab as TabKey)
    : 'karya';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [entries, setEntries] = useState<AssessmentEntry[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const [sendingFeedback, setSendingFeedback] = useState<string | null>(null);

  const activeTabInfo = TABS.find(t => t.key === activeTab)!;

  useEffect(() => {
    const load = async () => {
      if (!student) return;
      setLoading(true);
      try {
        if (activeTab === 'pdf') {
          setReportCards(await fetchReportCardsByStudent(student.id ?? ''));
        } else {
          const category = activeTab as AssessmentCategory;
          const items = await fetchAssessmentsByStudent(student.id ?? '', category);
          setEntries(items);
        }
      } catch (err) {
        console.error('Gagal memuat Rapor Digital:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [student, activeTab]);

  // Kelompokkan Foto Progress Hasil Karya per tema, lalu per semester
  const groupedByTheme = useMemo(() => {
    if (activeTab !== 'karya') return [];
    const groups = new Map<string, AssessmentEntry[]>();
    entries.forEach(e => {
      const key = e.theme || 'Tanpa Tema';
      groups.set(key, [...(groups.get(key) ?? []), e]);
    });
    return Array.from(groups.entries());
  }, [entries, activeTab]);

  const handleSendFeedback = async (assessmentId: string) => {
    const message = feedbackDraft[assessmentId]?.trim();
    if (!message) return;
    setSendingFeedback(assessmentId);
    try {
      await addParentFeedback(assessmentId, message);
      setEntries(prev =>
        prev.map(e => (e.id === assessmentId ? { ...e, parentFeedback: { message, createdAt: new Date() } } : e))
      );
      setFeedbackDraft(prev => ({ ...prev, [assessmentId]: '' }));
    } catch (err) {
      console.error('Gagal mengirim feedback:', err);
    } finally {
      setSendingFeedback(null);
    }
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-slate-500">Memuat data...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-600">Akun Anda belum tertaut ke data siswa.</p>
        <p className="text-sm text-slate-400 mt-1">Hubungi admin sekolah untuk menautkan akun Anda ke data anak.</p>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rapor Digital</h1>
        <p className="text-sm text-slate-500">
          Perkembangan {student.nickname || student.name} · {student.class}
        </p>
      </div>

      {/* Dropdown pemilih kategori */}
      <div className="relative mb-6 max-w-xl">
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-soft"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <activeTabInfo.icon className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold text-slate-900">{activeTabInfo.label}</span>
              <span className="block text-xs text-slate-400">{activeTabInfo.desc}</span>
            </span>
          </span>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-100 bg-white p-1.5 shadow-soft-lg">
            {TABS.map(tab => (
              <Link
                key={tab.key}
                to={`/parent/report/${tab.key}`}
                onClick={() => setDropdownOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  tab.key === activeTab ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-slate-500">Memuat data...</span>
        </div>
      ) : activeTab === 'karya' ? (
        groupedByTheme.length === 0 ? (
          <EmptyState text="Belum ada foto hasil karya yang diinput guru." />
        ) : (
          <div className="space-y-6">
            {groupedByTheme.map(([theme, items]) => (
              <div key={theme} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{theme}</h2>
                  <span className="badge badge-primary">{items[0]?.semester} {items[0]?.academicYear}</span>
                </div>
                <PhotoGrid items={items} />
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'kegiatan' ? (
        entries.length === 0 ? (
          <EmptyState text="Belum ada foto kegiatan yang diinput guru." />
        ) : (
          <div className="card p-5">
            <PhotoGrid items={entries} />
          </div>
        )
      ) : activeTab === 'catatan' ? (
        entries.length === 0 ? (
          <EmptyState text="Belum ada catatan guru." />
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900">{entry.teacherName || 'Guru'}</span>
                  <span className="text-xs text-slate-400">{dayjs(entry.createdAt).format('DD MMM YYYY, HH:mm')}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line">{entry.note}</p>

                {entry.parentFeedback ? (
                  <div className="mt-3 rounded-xl bg-secondary-50 border border-secondary-100 p-3">
                    <p className="text-xs font-medium text-secondary-700 mb-1">Feedback Anda</p>
                    <p className="text-sm text-slate-700">{entry.parentFeedback.message}</p>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Tulis feedback untuk guru..."
                      value={feedbackDraft[entry.id] ?? ''}
                      onChange={e => setFeedbackDraft(prev => ({ ...prev, [entry.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleSendFeedback(entry.id)}
                      disabled={sendingFeedback === entry.id || !feedbackDraft[entry.id]?.trim()}
                      className="btn btn-primary px-3"
                    >
                      {sendingFeedback === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : reportCards.length === 0 ? (
        <EmptyState text="Belum ada file rapor PDF yang diupload." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reportCards.map(rc => (
            <div key={rc.id} className="card p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Semester {rc.semester} {rc.academicYear}</p>
                  <p className="text-xs text-slate-400">{rc.fileName}</p>
                </div>
              </div>
              <iframe
                src={getDrivePreviewUrl(rc.fileId)}
                className="w-full h-56 rounded-xl border border-slate-100"
                title={rc.fileName}
              />
              <a
                href={getDriveDownloadUrl(rc.fileId)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary mt-3 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Unduh PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PhotoGrid = ({ items }: { items: AssessmentEntry[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {items.map(item => (
      <div key={item.id} className="rounded-xl overflow-hidden border border-slate-100">
        {item.photoFileId ? (
          <img
            src={getDriveImageUrl(item.photoFileId)}
            alt={item.note || 'Dokumentasi'}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-32 bg-slate-50 flex items-center justify-center text-slate-300">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        <div className="p-2">
          {item.note && <p className="text-xs text-slate-600 line-clamp-2">{item.note}</p>}
          <p className="text-[11px] text-slate-400 mt-1">
            {item.teacherName} · {dayjs(item.createdAt).format('DD MMM YYYY')}
          </p>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="card p-10 text-center">
    <p className="text-slate-500 text-sm">{text}</p>
  </div>
);

export default DigitalReport;
