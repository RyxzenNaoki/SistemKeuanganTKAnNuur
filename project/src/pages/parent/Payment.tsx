import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import UploadPaymentModal from '../../components/parent/PaymentProofModal';

interface PaymentHistoryItem {
  id: string;
  amount: number;
  category: string;
  date: Date;
  status: string;
  notes?: string;
  receiptUrl?: string;
}

const Payment = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'incomes'), where('student', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
        })) as PaymentHistoryItem[];
        setHistory(data);
      } catch (err) {
        console.error('Error fetching payment history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  return (
    <div className="page-transition space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Riwayat Pembayaran</h1>
        <button
          className="bg-primary-600 text-white text-sm px-4 py-2 rounded hover:bg-primary-700 transition"
          onClick={() => setShowModal(true)}
        >
          Tambah Pembayaran
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <p>Memuat data...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">Belum ada riwayat pembayaran</p>
          ) : (
            history.map(payment => (
              <div key={payment.id} className="card p-4 relative">
                <h2 className="font-semibold text-lg text-gray-800">{payment.category}</h2>
                <p className="text-sm text-gray-600">Rp {payment.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{dayjs(payment.date).format('DD MMM YYYY')}</p>
                <p className="text-sm text-gray-500">Status: {payment.status}</p>
                {payment.notes && <p className="text-sm text-gray-400 italic">Catatan: {payment.notes}</p>}
                <button
                  className="absolute top-2 right-2 text-primary-600 text-sm hover:underline"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowModal(true);
                  }}
                >
                  Upload Bukti
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Informasi Rekening Sekolah</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Bank:</strong> BNI</li>
              <li><strong>Atas Nama:</strong> TK An Nuur Rumah Cahaya</li>
              <li><strong>No. Rekening:</strong> 0795834521</li>
              <li><strong>Catatan:</strong> Sertakan nama siswa dan jenis pembayaran saat transfer.</li>
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Keterangan</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>1. Uang sarana prasarana (Gedung) bisa diangsur selama <strong>3 Bulan</strong></li>
              <li>2. SPP bulanan sebesar Rp 250.000 (terdiri dari SPP, makan sehat, tabungan pentas seni)</li>
              <li>3. Hari efektif: <strong>Senin s.d. Jumat</strong></li>
              <li>4. Diskon Rp 150.000 Uang Gedung untuk saudara kandung alumni</li>
            </ul>
          </div>
        </div>
      </div>

      <UploadPaymentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment || undefined}
      />
    </div>
  );
};

export default Payment;
