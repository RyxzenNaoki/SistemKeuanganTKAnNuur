import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Student {
  id?: string;
  nis?: string; // Nomor Induk Siswa (optional)
  name: string; // Nama lengkap siswa
  nickname?: string; // Nama panggilan siswa
  class: string;
  academicYear: string; // Added academic year field
  parentUid?: string; // UID akun orang tua (users/{uid}) yang tertaut ke siswa ini
  source?: 'admin' | 'parent-registration'; // Asal data siswa
  verified?: boolean; // false = diisi ortu saat daftar, belum dicek admin
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  status: 'active' | 'alumni';
  registrationDate: Date;
  birthDate: Date;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// You can add more student-related interfaces and functions here as needed
export interface StudentSummary {
  totalStudents: number;
  activeStudents: number;
  alumni: number;
  byClass: Record<string, number>;
  byAcademicYear: Record<string, number>;
}

export interface StudentFilters {
  searchTerm?: string;
  class?: string;
  academicYear?: string;
  status?: 'active' | 'alumni' | 'all';
}

// Utility functions
export const generateNIS = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${year}${month}${random}`;
};

export const getAcademicYearOptions = (yearsRange: number = 2): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -yearsRange; i <= yearsRange; i++) {
    const year = currentYear + i;
    years.push(`${year}/${year + 1}`);
  }
  return years;
};

export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  // If we're in the first half of the year (Jan-June), academic year started previous year
  const academicStartYear = now.getMonth() < 6 ? currentYear - 1 : currentYear;
  return `${academicStartYear}/${academicStartYear + 1}`;
};

export const validateStudent = (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): string[] => {
  const errors: string[] = [];

  if (!student.name?.trim()) errors.push('Nama siswa wajib diisi');
  if (!student.class?.trim()) errors.push('Kelas wajib diisi');
  if (!student.academicYear?.trim()) errors.push('Tahun ajaran wajib diisi');
  if (!student.parentName?.trim()) errors.push('Nama orang tua wajib diisi');
  if (!student.parentEmail?.trim()) errors.push('Email orang tua wajib diisi');
  if (!student.parentPhone?.trim()) errors.push('Nomor telepon wajib diisi');
  if (!student.address?.trim()) errors.push('Alamat wajib diisi');
  if (!student.emergencyContact?.trim()) errors.push('Kontak darurat wajib diisi');
  if (!student.emergencyPhone?.trim()) errors.push('Nomor darurat wajib diisi');

  // NIS validation (optional but must be numeric if provided)
  if (student.nis && student.nis.trim()) {
    const nisRegex = /^[0-9]+$/;
    if (!nisRegex.test(student.nis.trim())) {
      errors.push('NIS hanya boleh berisi angka');
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (student.parentEmail && !emailRegex.test(student.parentEmail)) {
    errors.push('Format email tidak valid');
  }

  return errors;
};

export const filterStudents = (
  students: Student[],
  filters: StudentFilters
): Student[] => {
  let filtered = students;

  // Filter by search term
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(student =>
      student.name.toLowerCase().includes(searchLower) ||
      student.class.toLowerCase().includes(searchLower) ||
      student.parentName.toLowerCase().includes(searchLower) ||
      (student.nis && student.nis.toLowerCase().includes(searchLower)) ||
      (student.academicYear && student.academicYear.toLowerCase().includes(searchLower))
    );
  }

  // Filter by class
  if (filters.class && filters.class !== 'all') {
    filtered = filtered.filter(student => student.class === filters.class);
  }

  // Filter by academic year
  if (filters.academicYear && filters.academicYear !== 'all') {
    filtered = filtered.filter(student => student.academicYear === filters.academicYear);
  }

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(student => student.status === filters.status);
  }

  return filtered;
};

export const getStudentSummary = (students: Student[]): StudentSummary => {
  const summary: StudentSummary = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    alumni: students.filter(s => s.status === 'alumni').length,
    byClass: {},
    byAcademicYear: {}
  };

  // Count by class
  students.forEach(student => {
    summary.byClass[student.class] = (summary.byClass[student.class] || 0) + 1;
  });

  // Count by academic year
  students.forEach(student => {
    if (student.academicYear) {
      summary.byAcademicYear[student.academicYear] = (summary.byAcademicYear[student.academicYear] || 0) + 1;
    }
  });

  return summary;
};

// ---------------------------------------------------------------------------
// Integrasi siswa <-> akun orang tua
// Dipakai bersama oleh Admin, Guru, dan Orang Tua.
// ---------------------------------------------------------------------------

const toDate = (value: unknown): Date => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
};

export const mapStudentDoc = (id: string, data: Record<string, any>): Student => ({
  id,
  nis: data.nis,
  name: data.name ?? '',
  nickname: data.nickname ?? '',
  class: data.class ?? '',
  academicYear: data.academicYear ?? '',
  parentName: data.parentName ?? '',
  parentEmail: data.parentEmail ?? '',
  parentPhone: data.parentPhone ?? '',
  parentUid: data.parentUid,
  source: data.source,
  verified: data.verified,
  status: data.status ?? 'active',
  registrationDate: toDate(data.registrationDate),
  birthDate: toDate(data.birthDate),
  address: data.address ?? '',
  emergencyContact: data.emergencyContact ?? '',
  emergencyPhone: data.emergencyPhone ?? '',
  medicalNotes: data.medicalNotes,
});

// Nama yang ditampilkan di UI: panggilan kalau ada, kalau tidak nama lengkap
export const getDisplayName = (student: Pick<Student, 'name' | 'nickname'>): string =>
  student.nickname?.trim() || student.name;

export interface FetchStudentsOptions {
  className?: string;
  onlyActive?: boolean;
}

// Semua siswa (untuk Admin & Guru: absensi, asesmen, dropdown, dll)
export const fetchStudents = async (options: FetchStudentsOptions = {}): Promise<Student[]> => {
  const snap = await getDocs(collection(db, 'students'));
  let list = snap.docs.map(d => mapStudentDoc(d.id, d.data()));
  if (options.onlyActive) list = list.filter(s => s.status === 'active');
  if (options.className) list = list.filter(s => s.class === options.className);
  return list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
};

// Siswa milik satu akun orang tua (ditemukan lewat UID, lalu fallback email)
export const fetchStudentsByParent = async (uid: string, email?: string | null): Promise<Student[]> => {
  const byUid = await getDocs(query(collection(db, 'students'), where('parentUid', '==', uid)));
  if (!byUid.empty) return byUid.docs.map(d => mapStudentDoc(d.id, d.data()));

  if (email) {
    const byEmail = await getDocs(query(collection(db, 'students'), where('parentEmail', '==', email)));
    if (!byEmail.empty) return byEmail.docs.map(d => mapStudentDoc(d.id, d.data()));
  }
  return [];
};

export interface LinkParentInput {
  uid: string;
  email: string;
  parentName: string;
  studentName: string;
  studentNickname: string;
  studentClass: string;
}

// Dipanggil saat orang tua mendaftar.
// 1) Kalau admin sudah menginput siswa dengan email ortu yang sama -> tautkan.
// 2) Kalau belum ada -> buat data siswa baru berstatus "belum diverifikasi" supaya
//    langsung muncul di Data Siswa (Admin) dan daftar murid (Guru).
export const linkParentToStudent = async (input: LinkParentInput): Promise<{ studentId: string; created: boolean }> => {
  const { uid, email, parentName, studentName, studentNickname, studentClass } = input;

  // Pencocokan hanya lewat email ortu (yang diinput admin di Data Siswa).
  // Pencarian berdasarkan nama tidak dipakai: ortu tidak boleh membaca seluruh data siswa.
  const match = await getDocs(query(collection(db, 'students'), where('parentEmail', '==', email)));

  if (match.docs.length > 0) {
    const existing = match.docs[0];
    await updateDoc(doc(db, 'students', existing.id), {
      parentUid: uid,
      ...(existing.data().nickname ? {} : { nickname: studentNickname }),
      updatedAt: serverTimestamp(),
    });
    return { studentId: existing.id, created: false };
  }

  const created = await addDoc(collection(db, 'students'), {
    name: studentName,
    nickname: studentNickname,
    class: studentClass,
    academicYear: getCurrentAcademicYear(),
    parentName,
    parentEmail: email,
    parentPhone: '',
    parentUid: uid,
    status: 'active',
    source: 'parent-registration',
    verified: false,
    registrationDate: serverTimestamp(),
    birthDate: serverTimestamp(),
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { studentId: created.id, created: true };
};

// Semester berjalan berdasarkan bulan sekarang: Juli-Des = Ganjil, Jan-Jun = Genap
export type Semester = 'Ganjil' | 'Genap';

export const getCurrentSemester = (): Semester => (new Date().getMonth() >= 6 ? 'Ganjil' : 'Genap');
