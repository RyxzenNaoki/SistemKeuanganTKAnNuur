import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { stripUndefined } from '../utils/firestore';

// ---------------------------------------------------------------------------
// Modul Orang Tua untuk Rapor Mengaji (kumpulan doa & hadits)
// Diunggah admin; orang tua mengunduhnya dari tab Rapor Mengaji.
// Disimpan di dokumen settings/mengajiModule. Bisa berupa file yang diunggah
// ke Google Drive (fileId) ATAU tautan Drive (externalUrl) untuk file > 4 MB.
// ---------------------------------------------------------------------------

export interface MengajiModule {
  fileId?: string;
  fileName?: string;
  externalUrl?: string;
  updatedAt?: Date;
}

const REF = () => doc(db, 'settings', 'mengajiModule');

export const fetchMengajiModule = async (): Promise<MengajiModule | null> => {
  const snap = await getDoc(REF());
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d.fileId && !d.externalUrl) return null;
  return {
    fileId: d.fileId,
    fileName: d.fileName,
    externalUrl: d.externalUrl,
    updatedAt: d.updatedAt?.toDate?.(),
  };
};

// Menimpa seluruh dokumen (tanpa merge): field yang tidak diisi otomatis terhapus,
// jadi mengganti file dengan tautan (atau sebaliknya) tidak meninggalkan data lama.
export const saveMengajiModule = async (input: Omit<MengajiModule, 'updatedAt'>): Promise<void> => {
  await setDoc(REF(), { ...stripUndefined(input), updatedAt: Timestamp.now() });
};

export const clearMengajiModule = async (): Promise<void> => {
  await setDoc(REF(), { updatedAt: Timestamp.now() });
};

// Alamat unduh: file Drive diunduh langsung, tautan eksternal dibuka apa adanya
export const getMengajiModuleUrl = (m: MengajiModule): string =>
  m.fileId ? `https://drive.google.com/uc?export=download&id=${m.fileId}` : (m.externalUrl ?? '#');
