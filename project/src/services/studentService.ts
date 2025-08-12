export interface Student {
  id?: string;
  nis?: string; // Nomor Induk Siswa (optional)
  name: string;
  class: string;
  academicYear: string; // Added academic year field
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