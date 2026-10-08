import { saveAs } from 'file-saver';

// Export array of flat objects to a downloaded CSV file. Keys of the first
// object become the header row (so pass already-formatted, human-readable
// objects — e.g. { Tanggal: '...', Kategori: '...' } — not raw Firestore docs).
export const exportToCSV = (rows: Record<string, unknown>[], filename: string): void => {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  // \uFEFF (BOM) supaya Excel membuka karakter non-ASCII dengan benar
  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};
