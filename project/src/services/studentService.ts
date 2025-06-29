import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Student {
  id?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'students';

export class StudentService {
  // Get all students
  static async getAllStudents(): Promise<Student[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate() || new Date(),
        birthDate: doc.data().birthDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Student[];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }
  }

  // Get students by class
  static async getStudentsByClass(className: string): Promise<Student[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('class', '==', className),
        where('status', '==', 'active'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate() || new Date(),
        birthDate: doc.data().birthDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Student[];
    } catch (error) {
      console.error('Error fetching students by class:', error);
      throw new Error('Failed to fetch students by class');
    }
  }

  // Add new student
  static async addStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...studentData,
        registrationDate: Timestamp.fromDate(studentData.registrationDate),
        birthDate: Timestamp.fromDate(studentData.birthDate),
        createdAt: now,
        updatedAt: now,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding student:', error);
      throw new Error('Failed to add student');
    }
  }

  // Update student
  static async updateStudent(id: string, studentData: Partial<Omit<Student, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const studentRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = {
        ...studentData,
        updatedAt: Timestamp.now(),
      };

      // Convert dates to Timestamps if they exist
      if (studentData.registrationDate) {
        updateData.registrationDate = Timestamp.fromDate(studentData.registrationDate);
      }
      if (studentData.birthDate) {
        updateData.birthDate = Timestamp.fromDate(studentData.birthDate);
      }

      await updateDoc(studentRef, updateData);
    } catch (error) {
      console.error('Error updating student:', error);
      throw new Error('Failed to update student');
    }
  }

  // Delete student
  static async deleteStudent(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting student:', error);
      throw new Error('Failed to delete student');
    }
  }

  // Search students
  static async searchStudents(searchTerm: string): Promise<Student[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      const allStudents = await this.getAllStudents();
      
      return allStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Failed to search students');
    }
  }
}