// Warna lencana bidang kegiatan (Kognitif, Bahasa, Motorik, Seni, dst.)
// dipakai di preview Modul Ajar (admin) dan Beranda Guru supaya konsisten.
export const getDomainBadgeClass = (domain: string): string => {
  const d = domain.toLowerCase();
  if (d.includes('kognitif')) return 'bg-primary-100 text-primary-700';
  if (d.includes('bahasa')) return 'bg-secondary-100 text-secondary-700';
  if (d.includes('motorik')) return 'bg-success-100 text-success-700';
  if (d.includes('seni')) return 'bg-accent-100 text-accent-800';
  return 'bg-slate-100 text-slate-600';
};
