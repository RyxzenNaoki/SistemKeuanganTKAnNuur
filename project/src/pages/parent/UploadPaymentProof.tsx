import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import PaymentProofModal from '../../components/parent/PaymentProofModal';

interface PaymentProof {
  id: string;
  paymentType: string;
  amount: number;
  paymentDate: Date;
  bankAccount: string;
  referenceNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: Date;
  notes?: string;
  fileName: string;
  adminNotes?: string;
}

const UploadPaymentProof: React.FC = () => {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Sample data - replace with actual data from Firebase
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([
    {
      id: '1',
      paymentType: 'SPP Bulanan',
      amount: 500000,
      paymentDate: new Date('2025-06-05'),
      bankAccount: 'Bank BCA - 1234567890',
      referenceNumber: 'TRX123456789',
      status: 'verified',
      submittedAt: new Date('2025-06-05'),
      fileName: 'bukti_spp_juni.jpg',
      adminNotes: 'Pembayaran telah diverifikasi dan dicatat.',
    },
    {
      id: '2',
      paymentType: 'Uang Kegiatan',
      amount: 150000,
      paymentDate: new Date('2025-06-10'),
      bankAccount: 'Bank Mandiri - 0987654321',
      referenceNumber: 'TRX987654321',
      status: 'pending',
      submittedAt: new Date('2025-06-10'),
      fileName: 'bukti_kegiatan.pdf',
    },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: PaymentProof['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="badge badge-success flex items-center w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terverifikasi
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-error flex items-center w-fit">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ditolak
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning flex items-center w-fit">
            <AlertCircle className="h-3 w-3 mr-1" />
            Menunggu Verifikasi
          </span>
        );
    }
  };

  const handleSubmitProof = async (data: any) => {
    try {
      setModalLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newProof: PaymentProof = {
        id: Date.now().toString(),
        paymentType: data.paymentType,
        amount: data.amount,
        paymentDate: data.paymentDate,
        bankAccount: data.bankAccount,
        referenceNumber: data.referenceNumber,
        status: 'pending',
        submittedAt: new Date(),
        notes: data.notes,
        fileName: data.proofFile.name,
      };
      
      setPaymentProofs(prev => [newProof, ...prev]);
    } catch (error) {
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const pendingCount = paymentProofs.filter(proof => proof.status === 'pending').length;
  const verifiedCount = paymentProofs.filter(proof => proof.status === 'verified').length;
  const rejectedCount = paymentProofs.filter(proof => proof.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Bukti Pembayaran</h1>
        <p className="text-gray-600 mt-2">
          Upload bukti pembayaran untuk verifikasi oleh admin sekolah.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Upload</p>
              <p className="text-2xl font-bold text-gray-900">{paymentProofs.length}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu</p>
              <p className="text-2xl font-bold text-warning-600">{pendingCount}</p>
            </div>
            <div className="p-2 bg-warning-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Terverifikasi</p>
              <p className="text-2xl font-bold text-success-600">{verifiedCount}</p>
            </div>
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ditolak</p>
              <p className="text-2xl font-bold text-error-600">{rejectedCount}</p>
            </div>
            <div className="p-2 bg-error-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-error-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Riwayat Upload</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Upload Bukti Baru
        </button>
      </div>

      {/* Payment Proofs List */}
      <div className="space-y-4">
        {paymentProofs.map((proof) => (
          <div key={proof.id} className="card p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{proof.paymentType}</h3>
                  {getStatusBadge(proof.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><strong>Jumlah:</strong> {formatCurrency(proof.amount)}</p>
                    <p><strong>Tanggal Bayar:</strong> {formatDate(proof.paymentDate)}</p>
                    <p><strong>Bank:</strong> {proof.bankAccount}</p>
                  </div>
                  <div>
                    <p><strong>No. Referensi:</strong> {proof.referenceNumber}</p>
                    <p><strong>Upload:</strong> {formatDate(proof.submittedAt)}</p>
                    <p><strong>File:</strong> {proof.fileName}</p>
                  </div>
                </div>

                {proof.adminNotes && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Catatan Admin:</strong> {proof.adminNotes}
                    </p>
                  </div>
                )}

                {proof.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Alasan Penolakan:</strong> Bukti pembayaran tidak jelas. Silakan upload ulang dengan kualitas yang lebih baik.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {/* Handle view file */}}
                  className="btn btn-secondary flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat File
                </button>
                
                {proof.status === 'rejected' && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Ulang
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {paymentProofs.length === 0 && (
          <div className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada bukti pembayaran</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload bukti pembayaran pertama Anda untuk memulai.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 btn btn-primary flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Bukti Pembayaran
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-blue-800 font-medium">Panduan Upload</h3>
            <ul className="text-blue-700 text-sm mt-2 space-y-1">
              <li>• Pastikan bukti pembayaran jelas dan dapat dibaca</li>
              <li>• Sertakan detail transaksi seperti tanggal, jumlah, dan nomor referensi</li>
              <li>• Format yang didukung: PNG, JPG, PDF (maksimal 10MB)</li>
              <li>• Verifikasi akan dilakukan dalam 1-2 hari kerja</li>
              <li>• Anda akan mendapat notifikasi setelah verifikasi selesai</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Proof Modal */}
      <PaymentProofModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitProof}
        loading={modalLoading}
      />
    </div>
  );
};

export default UploadPaymentProof;