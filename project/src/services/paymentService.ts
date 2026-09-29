import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ---------------------------------------------------------------------------
// Jadwal / tagihan pembayaran (koleksi "payments")
// Ditautkan lewat studentId + parentUid, BUKAN teks nama siswa, supaya:
// - konsisten walau nama ditulis beda-beda / diedit admin
// - bisa dibatasi lewat Firestore Rules (ortu hanya boleh baca tagihan miliknya)
// - begitu di-assign admin, otomatis tampil di akun ortu yang bersangkutan
// ---------------------------------------------------------------------------

export type PaymentStatus = 'upcoming' | 'overdue' | 'paid';

export interface Payment {
  id: string;
  studentId: string;
  studentName: string; // disalin saat assign, memudahkan tampilan tanpa join
  parentUid: string;
  class: string;
  type: string;
  amount: number;
  dueDate: Date;
  description: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PAYMENT_TYPES = [
  'SPP Bulanan',
  'Uang Pangkal',
  'Uang Kegiatan',
  'Uang Seragam',
  'Uang Buku',
  'Lainnya',
] as const;

// Status otomatis: kalau sudah ditandai lunas tetap lunas, kalau belum
// dibandingkan dengan tanggal jatuh tempo hari ini.
export const computePaymentStatus = (dueDate: Date, storedStatus: PaymentStatus): PaymentStatus => {
  if (storedStatus === 'paid') return 'paid';
  return dueDate.getTime() < new Date().setHours(0, 0, 0, 0) ? 'overdue' : 'upcoming';
};

const mapPaymentDoc = (id: string, data: Record<string, any>): Payment => {
  const dueDate = data.dueDate?.toDate?.() ?? new Date();
  return {
    id,
    studentId: data.studentId ?? '',
    studentName: data.studentName ?? '',
    parentUid: data.parentUid ?? '',
    class: data.class ?? '',
    type: data.type ?? '',
    amount: data.amount ?? 0,
    dueDate,
    description: data.description ?? '',
    status: computePaymentStatus(dueDate, data.status ?? 'upcoming'),
    paidAt: data.paidAt?.toDate?.(),
    createdAt: data.createdAt?.toDate?.(),
    updatedAt: data.updatedAt?.toDate?.(),
  };
};

// Semua tagihan (Admin -> Jadwal Pembayaran)
export const fetchAllPayments = async (): Promise<Payment[]> => {
  const snap = await getDocs(query(collection(db, 'payments'), orderBy('dueDate', 'desc')));
  return snap.docs.map(d => mapPaymentDoc(d.id, d.data()));
};

// Tagihan milik satu akun orang tua (Ortu -> Beranda & Riwayat Pembayaran)
export const fetchPaymentsByParent = async (parentUid: string): Promise<Payment[]> => {
  const snap = await getDocs(
    query(collection(db, 'payments'), where('parentUid', '==', parentUid), orderBy('dueDate', 'desc'))
  );
  return snap.docs.map(d => mapPaymentDoc(d.id, d.data()));
};

export interface AssignPaymentInput {
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  type: string;
  amount: number;
  dueDate: Date;
  description: string;
}

// Admin meng-assign tagihan ke satu siswa -> otomatis muncul di akun ortu terkait
export const assignPayment = async (input: AssignPaymentInput): Promise<void> => {
  await addDoc(collection(db, 'payments'), {
    ...input,
    status: 'upcoming' as PaymentStatus,
    dueDate: Timestamp.fromDate(input.dueDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const updatePayment = async (id: string, input: Partial<AssignPaymentInput> & { status?: PaymentStatus }): Promise<void> => {
  const { dueDate, ...rest } = input;
  await updateDoc(doc(db, 'payments', id), {
    ...rest,
    ...(dueDate ? { dueDate: Timestamp.fromDate(dueDate) } : {}),
    ...(input.status === 'paid' ? { paidAt: Timestamp.now() } : {}),
    updatedAt: Timestamp.now(),
  });
};

export const deletePayment = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'payments', id));
};

// ---------------------------------------------------------------------------
// Bukti pembayaran (koleksi "payment_proofs") — sudah ada sejak awal,
// ditautkan ulang ke tagihan (paymentId) supaya "Riwayat Pembayaran" ortu
// bisa menampilkan jumlah & histori yang sesuai dengan jadwal yang di-assign.
// ---------------------------------------------------------------------------

export interface PaymentProof {
  id: string;
  student: string; // uid ortu yang upload
  paymentId?: string; // tagihan yang dibayar, kalau ada
  paymentType: string;
  amount: number;
  paymentDate: Date;
  bankAccount: string;
  referenceNumber: string;
  notes?: string;
  fileId?: string;
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: Date;
}

const mapProofDoc = (id: string, data: Record<string, any>): PaymentProof => ({
  id,
  student: data.student,
  paymentId: data.paymentId,
  paymentType: data.paymentType,
  amount: data.amount ?? 0,
  paymentDate: data.paymentDate?.toDate?.() ?? new Date(),
  bankAccount: data.bankAccount ?? '',
  referenceNumber: data.referenceNumber ?? '',
  notes: data.notes,
  fileId: data.fileId,
  status: data.status ?? 'pending',
  uploadedAt: data.uploadedAt?.toDate?.() ?? data.uploadedAt ?? new Date(),
});

export const fetchPaymentProofsByParent = async (uid: string): Promise<PaymentProof[]> => {
  const snap = await getDocs(query(collection(db, 'payment_proofs'), where('student', '==', uid)));
  return snap.docs
    .map(d => mapProofDoc(d.id, d.data()))
    .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
};
