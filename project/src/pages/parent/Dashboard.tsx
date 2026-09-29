import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import { useParentStudents } from '../../hooks/useStudents';
import { fetchPaymentsByParent, Payment as PaymentRecord } from '../../services/paymentService';
import dayjs from 'dayjs';

// Interfaces
interface PaymentSchedule {
  id: string;
  type: string;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'upcoming' | 'overdue' | 'paid';
  studentName: string;
  class: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
}

interface UserData {
  email: string;
  role: string;
  name?: string;
  studentName?: string;
  studentNickname?: string;
  studentClass?: string;
  createdAt: Date;
}

const ParentDashboard = () => {
  const { currentUser } = useAuth();
  const { student: linkedStudent } = useParentStudents();
  const [studentName, setStudentName] = useState('');
  const [studentNickname, setStudentNickname] = useState('');
  const [className, setClassName] = useState('');
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextPayment, setNextPayment] = useState<PaymentSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Fetch user data from Firebase
  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setStudentName(data.studentName || 'Nama Siswa');
        setStudentNickname(data.studentNickname || '');
        setClassName(data.studentClass || 'Kelas Belum Diatur');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setStudentName('Nama Siswa');
      setClassName('Kelas Belum Diatur');
    }
  };

  // Ambil tagihan lewat parentUid (bukan cocokkan teks nama) supaya jadwal
  // yang di-assign admin di Data Siswa otomatis muncul di sini (poin 6c)
  const fetchPaymentSchedules = async () => {
    if (!currentUser) return;

    try {
      const records: PaymentRecord[] = await fetchPaymentsByParent(currentUser.uid);
      const schedules: PaymentSchedule[] = records.map(r => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        dueDate: r.dueDate,
        description: r.description,
        status: r.status,
        studentName: r.studentName,
        class: r.class,
      }));

      setPaymentSchedules(schedules);

      const upcoming = schedules
        .filter(p => p.status === 'upcoming')
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

      setNextPayment(upcoming || null);
    } catch (error) {
      console.error('Error fetching payment schedules:', error);
    }
  };

  // Fetch notifications from Firebase
  const fetchNotifications = async () => {
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(5) // Ambil 5 notifikasi terbaru
      );
      
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as Notification;
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Calculate days left for next payment
  const getDaysLeft = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Data siswa yang tertaut (Data Siswa) menjadi sumber utama, akun ortu jadi cadangan
  useEffect(() => {
    if (!linkedStudent) return;
    setStudentName(linkedStudent.name);
    setStudentNickname(linkedStudent.nickname || '');
    setClassName(linkedStudent.class || 'Kelas Belum Diatur');
  }, [linkedStudent]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      
      // First fetch user data
      await fetchUserData();
    };

    loadData();
  }, [currentUser]);

  // Load payment schedules and notifications when student data is available
  useEffect(() => {
    const loadPaymentData = async () => {
      if (!studentName) return;
      
      await Promise.all([
        fetchPaymentSchedules(),
        fetchNotifications()
      ]);
      setLoading(false);
    };

    loadPaymentData();
  }, [studentName]);

  if (loading) {
    return (
      <div className="page-transition">
        <div className="flex justify-center items-center h-64">
          <div className="text-slate-500">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Selamat Datang, Orang Tua!</h1>
        <p className="text-slate-600">Berikut ringkasan pembayaran dan informasi untuk {studentNickname || studentName}</p>
      </div>

      {/* Student Information */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-primary-100 via-white to-secondary-100 border-primary-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{studentName}</h2>
            {studentNickname && (
              <p className="text-sm text-slate-500">Panggilan: {studentNickname}</p>
            )}
            <p className="text-slate-600">{className}</p>
            <div className="mt-2 badge badge-primary">Siswa Aktif</div>
          </div>
          <div className="mt-4 md:mt-0">
            {nextPayment ? (
              <>
                <div className="text-sm text-slate-600">Pembayaran Berikutnya:</div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 text-warning-500 mr-1" />
                  <span className="text-sm font-medium text-warning-700">
                    {getDaysLeft(nextPayment.dueDate)} hari lagi
                  </span>
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatCurrency(nextPayment.amount)}
                </div>
                <div className="text-sm text-slate-600">
                  Jatuh tempo: {dayjs(nextPayment.dueDate).format('DD MMMM YYYY')}
                </div>
                <div className="text-sm text-slate-500">{nextPayment.description}</div>
              </>
            ) : (
              <div className="text-sm text-slate-500">Tidak ada pembayaran yang akan datang</div>
            )}
          </div>
        </div>
      </div>

      {/* Pengumuman — diletakkan di atas supaya langsung terlihat */}
      <div className="mb-6 rounded-2xl border border-accent-200 bg-gradient-to-r from-accent-100 via-accent-50 to-secondary-50 p-5 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-300 text-accent-900">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pengumuman</h2>
            <p className="text-xs text-slate-500">Informasi terbaru dari sekolah</p>
          </div>
        </div>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-xl bg-white/70 py-4 text-center text-sm text-slate-500">
              Belum ada pengumuman terbaru
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`rounded-xl bg-white p-3.5 border-l-4 shadow-soft ${index === 0 ? 'border-secondary-400' : 'border-accent-400'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3>
                  {index === 0 && <span className="badge badge-secondary shrink-0">Terbaru</span>}
                </div>
                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                <p className="text-xs text-slate-400 mt-1.5">
                  {dayjs(notification.createdAt).format('DD MMM YYYY, HH:mm')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Status dan Informasi Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Status */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Status Pembayaran SPP</h2>
          <div className="overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Jenis</th>
                    <th>Status</th>
                    <th>Jatuh Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-slate-500">
                        Belum ada jadwal pembayaran
                      </td>
                    </tr>
                  ) : (
                    paymentSchedules.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <div>
                            <div className="font-medium text-slate-900">{payment.type}</div>
                            <div className="text-sm text-slate-500">{payment.description}</div>
                          </div>
                        </td>
                        <td>
                          {payment.status === 'paid' ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-success-500 mr-1" />
                              <span className="text-success-700">Lunas</span>
                            </div>
                          ) : payment.status === 'overdue' ? (
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-error-500 mr-1" />
                              <span className="text-error-700">Terlambat</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-warning-500 mr-1" />
                              <span className="text-warning-700">Akan Datang</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div>
                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                            <div className="text-sm text-slate-500">
                              {dayjs(payment.dueDate).format('DD MMM YYYY')}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Informasi Pembayaran */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Informasi Pembayaran</h2>
          <div className="border border-slate-200 rounded-xl p-4 mb-4">
            <h3 className="text-md font-medium text-slate-900 mb-2">Transfer Bank</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-slate-600">Bank BNI</p>
                <p className="text-sm font-medium">0795834521 (Rita Ayu Bulan Trisna)</p>
              </div>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-md font-medium text-slate-900 mb-2">Panduan Pembayaran</h3>
            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
              <li>Transfer ke rekening di atas</li>
              <li>Simpan bukti pembayaran</li>
              <li>Upload bukti di menu "Upload Bukti"</li>
              <li>Konfirmasi upload bukti ke admin</li>
              <li>Kwitansi akan dikirim secara langsung/via email</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;