import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CreditCard,
  Calendar,
  Upload,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// Sample data for demonstration
const paymentHistoryData = [
  { month: 'Jan', amount: 500000 },
  { month: 'Feb', amount: 500000 },
  { month: 'Mar', amount: 750000 },
  { month: 'Apr', amount: 500000 },
  { month: 'Mei', amount: 550000 },
  { month: 'Jun', amount: 500000 },
];

const ParentDashboard = () => {
  const [studentName, setStudentName] = useState('Budi Santoso');
  const [className, setClassName] = useState('TK B - Mawar');
  const [nextPayment, setNextPayment] = useState({
    type: 'SPP Bulanan',
    amount: 500000,
    dueDate: '10 Juli 2025',
    daysLeft: 5,
  });
  const [paymentStatus, setPaymentStatus] = useState([
    { month: 'Januari', status: 'paid' },
    { month: 'Februari', status: 'paid' },
    { month: 'Maret', status: 'paid' },
    { month: 'April', status: 'paid' },
    { month: 'Mei', status: 'paid' },
    { month: 'Juni', status: 'paid' },
    { month: 'Juli', status: 'upcoming' },
  ]);

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
            <div className="text-sm text-gray-600">Pembayaran Berikutnya:</div>
            <div className="flex items-center mt-1">
              <Clock className="h-4 w-4 text-warning-500 mr-1" />
              <span className="text-sm font-medium text-warning-700">
                {nextPayment.daysLeft} hari lagi
              </span>
            </div>
            <div className="mt-1 text-lg font-bold text-gray-900">
              {formatCurrency(nextPayment.amount)}
            </div>
            <div className="text-sm text-gray-600">Jatuh tempo: {nextPayment.dueDate}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/parent/make-payment" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
            <CreditCard className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">Bayar SPP</span>
          </Link>
          <Link to="/parent/history" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
            <Calendar className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">Riwayat Pembayaran</span>
          </Link>
          <Link to="/parent/upload" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
            <Upload className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">Upload Bukti</span>
          </Link>
          <Link to="/parent/contact" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
            <MessageSquare className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900 text-center">Hubungi Admin</span>
          </Link>
        </div>
      </div>

      {/* Payment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment History Chart */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Pembayaran</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentHistoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="amount" name="Jumlah Bayar" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Pembayaran SPP</h2>
          <div className="overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentStatus.map((payment, index) => (
                    <tr key={index}>
                      <td>{payment.month}</td>
                      <td>
                        {payment.status === 'paid' ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-success-500 mr-1" />
                            <span className="text-success-700">Lunas</span>
                          </div>
                        ) : payment.status === 'late' ? (
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
                        {payment.status === 'paid' ? '5 ' + payment.month + ' 2025' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pembayaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Transfer Bank</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Bank BCA</p>
                <p className="text-sm font-medium">1234567890 (TK An Nuur Rumah Cahaya)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bank Mandiri</p>
                <p className="text-sm font-medium">0987654321 (TK An Nuur Rumah Cahaya)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bank BRI</p>
                <p className="text-sm font-medium">1122334455 (TK An Nuur Rumah Cahaya)</p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Panduan Pembayaran</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Transfer ke salah satu rekening di samping</li>
              <li>Simpan bukti pembayaran</li>
              <li>Upload bukti di menu "Upload Bukti"</li>
              <li>Tunggu konfirmasi dari admin</li>
              <li>Kwitansi akan dikirim via email</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengumuman</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-primary-500 pl-3 py-1">
            <h3 className="text-sm font-medium text-gray-900">Kegiatan Hari Anak</h3>
            <p className="text-xs text-gray-600 mt-1">
              Kegiatan Hari Anak akan dilaksanakan pada tanggal 23 Juli 2025. Biaya kegiatan Rp150.000 dapat dibayarkan mulai 1 Juli.
            </p>
          </div>
          <div className="border-l-4 border-secondary-500 pl-3 py-1">
            <h3 className="text-sm font-medium text-gray-900">Libur Akhir Semester</h3>
            <p className="text-xs text-gray-600 mt-1">
              Libur akhir semester dimulai tanggal 20 Juni hingga 5 Juli 2025. Pembayaran SPP tetap dilakukan selama libur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;