import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
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
  studentClass?: string;
  createdAt: Date;
}

const ParentDashboard = () => {
  const { currentUser } = useAuth();
  const [studentName, setStudentName] = useState('');
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

  // Get auto status based on due date
  const getAutoStatus = (dueDate: Date, currentStatus: string): PaymentSchedule['status'] => {
    const today = new Date();
    if (currentStatus === 'paid') return 'paid';
    return dayjs(dueDate).isBefore(dayjs(today), 'day') ? 'overdue' : 'upcoming';
  };

  // Fetch user data from Firebase
  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setStudentName(data.studentName || 'Nama Siswa');
        setClassName(data.studentClass || 'Kelas Belum Diatur');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setStudentName('Nama Siswa');
      setClassName('Kelas Belum Diatur');
    }
  };

  // Fetch payment schedules from Firebase
  const fetchPaymentSchedules = async () => {
    if (!studentName) return;
    
    try {
      // Filter berdasarkan nama siswa
      const q = query(
        collection(db, 'payments'),
        where('studentName', '==', studentName),
        orderBy('dueDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const schedules = snapshot.docs.map(doc => {
        const data = doc.data();
        const dueDate = data.dueDate?.toDate?.() || new Date();
        const status = getAutoStatus(dueDate, data.status);
        
        return {
          id: doc.id,
          type: data.type,
          amount: data.amount,
          dueDate,
          description: data.description,
          status,
          studentName: data.studentName,
          class: data.class,
        } as PaymentSchedule;
      });

      setPaymentSchedules(schedules);

      // Find next upcoming payment
      const upcoming = schedules.filter(p => p.status === 'upcoming')
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
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Selamat Datang, Orang Tua!</h1>
        <p className="text-gray-600">Berikut ringkasan pembayaran dan informasi untuk {studentName}</p>
      </div>

      {/* Student Information */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-primary-100 to-purple-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{studentName}</h2>
            <p className="text-gray-600">{className}</p>
            <div className="mt-2 badge badge-primary">Siswa Aktif</div>
          </div>
          <div className="mt-4 md:mt-0">
            {nextPayment ? (
              <>
                <div className="text-sm text-gray-600">Pembayaran Berikutnya:</div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 text-warning-500 mr-1" />
                  <span className="text-sm font-medium text-warning-700">
                    {getDaysLeft(nextPayment.dueDate)} hari lagi
                  </span>
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {formatCurrency(nextPayment.amount)}
                </div>
                <div className="text-sm text-gray-600">
                  Jatuh tempo: {dayjs(nextPayment.dueDate).format('DD MMMM YYYY')}
                </div>
                <div className="text-sm text-gray-500">{nextPayment.description}</div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Tidak ada pembayaran yang akan datang</div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Status dan Informasi Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Status */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Pembayaran SPP</h2>
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
                      <td colSpan={3} className="text-center text-gray-500">
                        Belum ada jadwal pembayaran
                      </td>
                    </tr>
                  ) : (
                    paymentSchedules.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <div>
                            <div className="font-medium text-gray-900">{payment.type}</div>
                            <div className="text-sm text-gray-500">{payment.description}</div>
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
                            <div className="text-sm text-gray-500">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pembayaran</h2>
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Transfer Bank</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Bank BNI</p>
                <p className="text-sm font-medium">0795834521 (Rita Ayu Bulan Trisna)</p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Panduan Pembayaran</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Transfer ke rekening di atas</li>
              <li>Simpan bukti pembayaran</li>
              <li>Upload bukti di menu "Upload Bukti"</li>
              <li>Tunggu konfirmasi dari admin</li>
              <li>Kwitansi akan dikirim via email</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Pengumuman */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengumuman</h2>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Belum ada pengumuman terbaru
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div key={notification.id} className={`border-l-4 ${index % 2 === 0 ? 'border-primary-500' : 'border-secondary-500'} pl-3 py-1`}>
                <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {dayjs(notification.createdAt).format('DD MMM YYYY, HH:mm')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;