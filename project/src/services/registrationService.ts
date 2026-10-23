import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserRole, initialStatusFor } from '../config/roles';
import { linkParentToStudent } from './studentService';

// Pembuatan profil pengguna baru — dipakai bersama oleh pendaftaran dengan
// email/password (RegisterPage) dan pendaftaran dengan Google (CompleteRegistrationPage),
// supaya aturan role, status (guru = menunggu persetujuan), dan penautan anak
// selalu sama. Data yang ditulis harus cocok dengan Firestore Rules koleksi "users".

export interface CreateUserProfileInput {
  uid: string;
  email: string;
  role: Exclude<UserRole, 'admin'>;
  name: string;
  studentName?: string;
  studentNickname?: string;
  studentClass?: string;
}

export const createUserProfile = async (input: CreateUserProfileInput): Promise<void> => {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const userData: Record<string, unknown> = {
    email,
    role: input.role,
    // Guru harus disetujui admin dulu; orang tua langsung aktif
    status: initialStatusFor(input.role),
    name,
    createdAt: serverTimestamp(),
  };

  if (input.role === 'parent') {
    userData.studentName = (input.studentName ?? '').trim();
    userData.studentNickname = (input.studentNickname ?? '').trim();
    userData.studentClass = input.studentClass ?? '';
  }

  await setDoc(doc(db, 'users', input.uid), userData);

  // Tautkan akun ortu ke data siswa (dipakai Admin & Guru). Kegagalan di sini
  // tidak membatalkan pendaftaran: admin masih bisa menautkan manual.
  if (input.role === 'parent') {
    try {
      const { studentId } = await linkParentToStudent({
        uid: input.uid,
        email,
        parentName: name,
        studentName: (input.studentName ?? '').trim(),
        studentNickname: (input.studentNickname ?? '').trim(),
        studentClass: input.studentClass ?? '',
      });
      await setDoc(doc(db, 'users', input.uid), { studentId }, { merge: true });
    } catch (linkError) {
      console.warn('Gagal menautkan siswa, admin dapat menautkan manual:', linkError);
    }
  }
};
