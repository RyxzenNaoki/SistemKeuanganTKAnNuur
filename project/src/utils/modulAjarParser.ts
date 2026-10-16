// Parser Modul Ajar mingguan (.docx) -> data terstruktur.
// Berjalan sepenuhnya di browser admin (tanpa library tambahan):
//   1) .docx adalah file zip -> baca word/document.xml (inflate pakai DecompressionStream bawaan browser)
//   2) uraikan XML Word -> tabel -> baris -> sel -> paragraf
//   3) ekstrak: tema/sub tema, minggu, semester, tahun ajaran, kelompok,
//      sub-sub tema per hari, dan KEGIATAN INTI per hari (+ jam intinya).
// Format yang dikenali adalah template Modul Ajar TK An Nuur (tabel "Jadwal
// Sub-Sub Tema Mingguan" dan "C. PENGALAMAN BELAJAR" dengan baris Awal/Inti/Istirahat/Penutup).

export interface ParsedActivity {
  domain: string; // Kognitif / Bahasa / Motorik / Seni, dst.
  text: string;
}

export interface ParsedDay {
  date: string; // YYYY-MM-DD
  dayName: string;
  subSubTheme?: string;
  intiStart?: string; // HH:mm
  intiEnd?: string; // HH:mm
  activities: ParsedActivity[];
}

export interface ParsedModulAjar {
  tema: string;
  subTema: string;
  weekNumber?: number;
  semester?: 'Ganjil' | 'Genap';
  academicYear?: string; // "2026/2027"
  group?: 'A' | 'B';
  program?: 'REGULER' | 'FULLDAY';
  startDate: string;
  endDate: string;
  days: ParsedDay[];
  warnings: string[];
}

// ============================ ZIP ============================

const readU16 = (v: DataView, o: number) => v.getUint16(o, true);
const readU32 = (v: DataView, o: number) => v.getUint32(o, true);

const inflateRaw = async (data: Uint8Array): Promise<Uint8Array> => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Browser Anda terlalu lama untuk membaca file Word. Perbarui Chrome/Edge/Safari lalu coba lagi.');
  }
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const readZipEntry = async (buffer: ArrayBuffer, wantedName: string): Promise<Uint8Array | null> => {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // End Of Central Directory (signature 0x06054b50), dicari dari belakang
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (readU32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('File ini bukan dokumen Word (.docx) yang valid.');

  const entryCount = readU16(view, eocd + 10);
  let pos = readU32(view, eocd + 16);
  const decoder = new TextDecoder('utf-8');

  for (let n = 0; n < entryCount; n++) {
    if (readU32(view, pos) !== 0x02014b50) break;
    const method = readU16(view, pos + 10);
    const compSize = readU32(view, pos + 20);
    const nameLen = readU16(view, pos + 28);
    const extraLen = readU16(view, pos + 30);
    const commentLen = readU16(view, pos + 32);
    const localOffset = readU32(view, pos + 42);
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLen));

    if (name === wantedName) {
      const localNameLen = readU16(view, localOffset + 26);
      const localExtraLen = readU16(view, localOffset + 28);
      const start = localOffset + 30 + localNameLen + localExtraLen;
      const raw = bytes.subarray(start, start + compSize);
      if (method === 0) return raw;
      if (method === 8) return inflateRaw(raw);
      throw new Error('Metode kompresi dokumen tidak didukung.');
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return null;
};

// ============================ XML ============================

interface XNode {
  name: string;
  attrs: Record<string, string>;
  children: XNode[];
  text: string; // hanya terisi untuk node teks ('#text')
}

const decodeEntities = (s: string) =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const parseXml = (xml: string): XNode => {
  const root: XNode = { name: '#root', attrs: {}, children: [], text: '' };
  const stack: XNode[] = [root];
  const token = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  const attrRe = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  let m: RegExpExecArray | null;
  while ((m = token.exec(xml)) !== null) {
    const [, cdata, closing, name, attrText, selfClose, text] = m;
    const top = stack[stack.length - 1];
    if (cdata !== undefined) {
      top.children.push({ name: '#text', attrs: {}, children: [], text: cdata });
    } else if (text !== undefined) {
      top.children.push({ name: '#text', attrs: {}, children: [], text: decodeEntities(text) });
    } else if (name) {
      if (closing) {
        if (stack.length > 1) stack.pop();
      } else {
        const attrs: Record<string, string> = {};
        let a: RegExpExecArray | null;
        attrRe.lastIndex = 0;
        while (attrText && (a = attrRe.exec(attrText)) !== null) attrs[a[1]] = decodeEntities(a[2] ?? a[3] ?? '');
        const node: XNode = { name, attrs, children: [], text: '' };
        top.children.push(node);
        if (!selfClose) stack.push(node);
      }
    }
  }
  return root;
};

const kids = (n: XNode, name: string) => n.children.filter(c => c.name === name);
const firstKid = (n: XNode, name: string) => n.children.find(c => c.name === name);

// ====================== WORD: PARAGRAF / TABEL ======================

interface Para {
  text: string;
  bold: boolean;
}

const isRunBold = (run: XNode): boolean => {
  const b = firstKid(firstKid(run, 'w:rPr') ?? { name: '', attrs: {}, children: [], text: '' }, 'w:b');
  if (!b) return false;
  const val = (b.attrs['w:val'] ?? '').toLowerCase();
  return val !== 'false' && val !== '0';
};

const paragraphsOf = (container: XNode): Para[] => {
  const result: Para[] = [];
  for (const p of kids(container, 'w:p')) {
    // Satu paragraf bisa memuat <w:br/> (baris baru) -> pecah jadi beberapa baris
    let current = '';
    let boldChars = 0;
    let plainChars = 0;
    const flush = () => {
      const text = current.replace(/\s+/g, ' ').trim();
      if (text) result.push({ text, bold: plainChars === 0 && boldChars > 0 });
      current = '';
      boldChars = 0;
      plainChars = 0;
    };
    for (const run of kids(p, 'w:r')) {
      const bold = isRunBold(run);
      for (const part of run.children) {
        if (part.name === 'w:t') {
          const t = part.children.map(c => c.text).join('');
          current += t;
          if (t.trim()) (bold ? (boldChars += t.trim().length) : (plainChars += t.trim().length));
        } else if (part.name === 'w:tab') {
          current += ' ';
        } else if (part.name === 'w:br') {
          flush();
        }
      }
    }
    flush();
  }
  return result;
};

interface Cell {
  paras: Para[];
  text: string;
}

const tableRows = (tbl: XNode): Cell[][] =>
  kids(tbl, 'w:tr').map(tr =>
    kids(tr, 'w:tc').map(tc => {
      const paras = paragraphsOf(tc);
      return { paras, text: paras.map(p => p.text).join(' ').trim() };
    })
  );

// ============================ UTIL ============================

const MONTHS: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8,
  september: 9, oktober: 10, november: 11, nopember: 11, desember: 12,
};

const pad = (n: number) => String(n).padStart(2, '0');

// "12 Oktober 2026" -> "2026-10-12"
const parseIndoDate = (text: string): string | null => {
  const m = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${pad(month)}-${pad(parseInt(m[1], 10))}`;
};

const normalizeDay = (s: string) => s.toLowerCase().replace(/[^a-z]/g, ''); // "Jum'at" -> "jumat"

const minutesToHHmm = (total: number) => `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;

const normalizeLabel = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/:$/, '').trim();

// ============================ EKSTRAKSI ============================

const extractInti = (paras: Para[]): ParsedActivity[] => {
  const activities: ParsedActivity[] = [];
  let domain = '';
  for (const p of paras) {
    const low = p.text.toLowerCase();
    if (/^merefleksi\b/.test(low)) break; // bagian refleksi = penutup inti, tidak ditampilkan
    if (/^pembelajaran tematik\b/.test(low)) continue;
    if (p.bold && p.text.length <= 40) {
      domain = p.text.replace(/:$/, '').trim();
      continue;
    }
    activities.push({ domain: domain || 'Kegiatan', text: p.text });
  }
  return activities;
};

export const parseModulAjar = async (buffer: ArrayBuffer): Promise<ParsedModulAjar> => {
  const entry = await readZipEntry(buffer, 'word/document.xml');
  if (!entry) throw new Error('Isi dokumen tidak ditemukan. Pastikan file berformat .docx (bukan .doc).');

  const root = parseXml(new TextDecoder('utf-8').decode(entry));
  const document = firstKid(root, 'w:document');
  const body = document ? firstKid(document, 'w:body') : undefined;
  if (!body) throw new Error('Struktur dokumen Word tidak dikenali.');

  const warnings: string[] = [];
  const outsideText = paragraphsOf(body).map(p => p.text).join(' ');
  const tables: Cell[][][] = kids(body, 'w:tbl').map(tableRows);
  const allText = outsideText + ' ' + tables.flat(2).map(c => c.text).join(' ');

  // ---- Tabel identitas (pasangan label/nilai) ----
  const HEADER_LABELS = ['usia / kelompok', 'semester', 'jumlah anak', 'minggu ke-', 'fase', 'hari / tanggal', 'tema / sub tema', 'alokasi waktu'];
  const header: Record<string, string> = {};
  for (const table of tables) {
    for (const row of table) {
      for (let i = 0; i + 1 < row.length; i += 2) {
        const label = normalizeLabel(row[i].text);
        if (HEADER_LABELS.includes(label) && !(label in header)) header[label] = row[i + 1].text;
      }
    }
  }

  const temaRaw = header['tema / sub tema'] ?? '';
  const slashAt = temaRaw.indexOf(' / ');
  const tema = (slashAt >= 0 ? temaRaw.slice(0, slashAt) : temaRaw).trim();
  const subTema = (slashAt >= 0 ? temaRaw.slice(slashAt + 3) : '').trim();
  if (!tema) warnings.push('Tema/Sub Tema tidak ditemukan di tabel identitas.');

  const weekMatch = (header['minggu ke-'] ?? '').match(/\d+/);
  const semesterText = header['semester'] ?? '';
  const semester = /ganjil/i.test(semesterText) ? 'Ganjil' : /genap/i.test(semesterText) ? 'Genap' : undefined;
  const yearMatch = allText.match(/(\d{4})\s*\/\s*(\d{4})/);
  const groupMatch = outsideText.match(/KELOMPOK\s+([AB])\b/i) ?? (header['usia / kelompok'] ?? '').match(/\/\s*([AB])\s*$/i);
  const program = /full\s*-?\s*day/i.test(allText) ? 'FULLDAY' : /reguler/i.test(allText) ? 'REGULER' : undefined;

  // ---- Sub-sub tema per hari ("Jadwal Sub-Sub Tema Mingguan") ----
  const subSubByDay: Record<string, string> = {};
  const dateByDay: Record<string, string> = {};
  for (const table of tables) {
    const head = table[0] ?? [];
    if (head.some(c => /sub-?\s*sub\s*tema/i.test(c.text)) && head.some(c => /^hari$/i.test(c.text))) {
      for (const row of table.slice(1)) {
        if (row.length < 3) continue;
        const key = normalizeDay(row[0].text);
        subSubByDay[key] = row[2].text;
        const d = parseIndoDate(row[1].text);
        if (d) dateByDay[key] = d;
      }
    }
  }

  // ---- Pengalaman belajar per hari ----
  const days: ParsedDay[] = [];
  let current: ParsedDay | null = null;
  let cursor = 7 * 60;

  for (const table of tables) {
    for (const row of table) {
      if (row.length === 0) continue;
      const first = row[0].text;

      const dayMatch = first.match(/^hari\s*:\s*(.+)$/i);
      if (dayMatch) {
        const dayName = dayMatch[1].trim();
        const key = normalizeDay(dayName);
        const date = (row[1] ? parseIndoDate(row[1].text) : null) ?? dateByDay[key];
        if (!date) {
          warnings.push(`Tanggal untuk hari ${dayName} tidak terbaca.`);
          current = null;
          continue;
        }
        const timeMatch = (row[2]?.text ?? '').match(/(\d{1,2})[.:](\d{2})\s*[–-]\s*(\d{1,2})[.:](\d{2})/);
        cursor = timeMatch ? parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10) : 7 * 60;
        current = { date, dayName, subSubTheme: subSubByDay[key], activities: [] };
        days.push(current);
        continue;
      }

      if (!current || row.length < 2) continue;
      const phase = first.match(/^(awal|inti|istirahat|penutup)\b/i);
      if (!phase) continue;
      const duration = parseInt(first.match(/\((\d+)\s*menit\)/i)?.[1] ?? '0', 10);

      if (phase[1].toLowerCase() === 'inti') {
        current.activities = extractInti(row[1].paras);
        if (duration > 0) {
          current.intiStart = minutesToHHmm(cursor);
          current.intiEnd = minutesToHHmm(cursor + duration);
        }
      }
      cursor += duration;
    }
  }

  if (days.length === 0) {
    throw new Error('Tidak ada hari pembelajaran yang terbaca. Pastikan file memakai template Modul Ajar TK An Nuur (tabel "C. PENGALAMAN BELAJAR").');
  }
  for (const d of days) {
    if (d.activities.length === 0) warnings.push(`Kegiatan inti hari ${d.dayName} tidak ditemukan atau kosong.`);
  }

  days.sort((a, b) => a.date.localeCompare(b.date));

  return {
    tema,
    subTema,
    weekNumber: weekMatch ? parseInt(weekMatch[0], 10) : undefined,
    semester,
    academicYear: yearMatch ? `${yearMatch[1]}/${yearMatch[2]}` : undefined,
    group: groupMatch ? (groupMatch[1].toUpperCase() as 'A' | 'B') : undefined,
    program,
    startDate: days[0].date,
    endDate: days[days.length - 1].date,
    days,
    warnings,
  };
};
