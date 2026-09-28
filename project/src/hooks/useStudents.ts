import { useCallback, useEffect, useState } from 'react';
import { fetchStudents, fetchStudentsByParent, Student, FetchStudentsOptions } from '../services/studentService';
import { useAuth } from '../contexts/AuthContext';

// Daftar siswa untuk Admin & Guru (absensi, asesmen, dropdown, dll).
export const useStudents = (options: FetchStudentsOptions = {}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { className, onlyActive } = options;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setStudents(await fetchStudents({ className, onlyActive }));
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  }, [className, onlyActive]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { students, loading, error, reload };
};

// Siswa milik orang tua yang sedang login (dipakai halaman Orang Tua).
export const useParentStudents = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentUser) return;
      try {
        const list = await fetchStudentsByParent(currentUser.uid, currentUser.email);
        if (active) setStudents(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [currentUser]);

  return { students, student: students[0] ?? null, loading };
};
