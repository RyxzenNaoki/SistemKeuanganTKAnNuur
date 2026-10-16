// Firestore menolak field dengan nilai persis `undefined` saat addDoc/updateDoc
// ("Unsupported field value: undefined"). Field opsional yang tidak diisi
// (mis. "theme" untuk kategori selain Hasil Karya, atau "photoFileId" kalau
// tidak upload foto) harus benar-benar dihilangkan dari objek, bukan dikirim
// sebagai undefined. Helper ini membersihkan itu sebelum tiap addDoc/updateDoc.

export const stripUndefined = <T extends object>(input: T): Partial<T> => {
  const output: Partial<T> = {};
  (Object.keys(input) as (keyof T)[]).forEach(key => {
    const value = input[key];
    if (value !== undefined) output[key] = value;
  });
  return output;
};

// Versi bersarang dari stripUndefined: membuang field undefined di dalam objek
// dan array berlapis (mis. daftar hari pada rencana mingguan). Timestamp, Date,
// dan nilai khusus Firestore (bukan objek polos) dibiarkan apa adanya.
export const deepStripUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.filter(item => item !== undefined).map(item => deepStripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const output: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (val !== undefined) output[key] = deepStripUndefined(val);
    });
    return output as T;
  }
  return value;
};
