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
