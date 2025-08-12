// Interface untuk data siswa
export interface Student {
  id?: string;
  nis?: string; // Nomor Induk Siswa - optional
  name: string;
  class: string;
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

// Interface untuk kelas (bisa juga dibuat file terpisah jika diperlukan)
export interface Class {
  id: string;
  name: string;
  teacher: string;
  studentCount: number;
  academicYear: string;
  capacity: number;
  description?: string;
}

// Helper functions untuk student service bisa ditambahkan di sini
export const generateNIS = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${year}${month}${random}`;
};

export const validateNIS = (nis: string): boolean => {
  const nisRegex = /^[0-9]+$/;
  return nisRegex.test(nis.trim());
};