import { useState, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
  payment?: PaymentHistoryItem;
}


interface PaymentProofData {
  student: string;
  paymentType: string;
  amount: number;
  paymentDate: Date;
  bankAccount: string;
  referenceNumber: string;
  notes: string;
  proofFile: File | null;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  receiptUrl?: string;
}

const PaymentProofModal = ({ isOpen, onClose, loading = false }: PaymentProofModalProps) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  if (!currentUser) {
    console.error("User belum login");
    return;
  }

  const [formData, setFormData] = useState<PaymentProofData>({
    student: currentUser.uid,
    paymentType: 'SPP Bulanan',
    amount: 0,
    paymentDate: new Date(),
    bankAccount: '',
    referenceNumber: '',
    notes: '',
    proofFile: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const paymentTypes = [
    'SPP Bulanan',
    'Formulir',
    'Uang Kegiatan, Alat, Bahan',
    'Uang Seragam',
    'Uang Sarana',
    'Lainnya',
  ];

  const bankAccounts = [
    'BNI - 0795834521 a.n Rita Ayu Bulan Trisna',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.paymentType) newErrors.paymentType = 'Jenis pembayaran wajib dipilih';
    if (formData.amount <= 0) newErrors.amount = 'Jumlah pembayaran harus lebih dari 0';
    if (!formData.bankAccount) newErrors.bankAccount = 'Rekening tujuan wajib dipilih';
    if (!formData.referenceNumber.trim()) newErrors.referenceNumber = 'Nomor referensi wajib diisi';
    if (!formData.proofFile) newErrors.proofFile = 'Bukti pembayaran wajib diupload';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!formData.proofFile) {
      alert('Mohon upload bukti pembayaran');
      return;
    }

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', formData.proofFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload ke Google Drive gagal');
      }

      const uploadData = await uploadRes.json();

      if (!uploadData?.fileId) {
        throw new Error("Upload berhasil tapi fileId tidak ditemukan.");
      }

      console.log('uploadData:', uploadData);

      await addDoc(collection(db, 'payment_proofs'), {
        student: currentUser.uid,
        paymentType: formData.paymentType,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        bankAccount: formData.bankAccount,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes || '',
        fileId: uploadData.fileId, // <- hanya fileId
        uploadedAt: new Date(),
      });


      alert('Bukti pembayaran berhasil diupload!');
      handleReset();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengupload.');
    }
  };


  const handleReset = () => {
    setFormData({
      student: currentUser.uid,
      paymentType: 'SPP Bulanan',
      amount: 0,
      paymentDate: new Date(),
      bankAccount: '',
      referenceNumber: '',
      notes: '',
      proofFile: null,
    });
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 :
        name === 'paymentDate' ? new Date(value) : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Format file tidak didukung. Gunakan JPG, PNG, atau PDF');
      return;
    }

    if (file.size > maxSize) {
      showToast('error', 'Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }

    setFormData(prev => ({ ...prev, proofFile: file }));
    if (errors.proofFile) {
      setErrors(prev => ({ ...prev, proofFile: '' }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Bukti Pembayaran
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Pembayaran *
                  </label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    className={`input ${errors.paymentType ? 'border-error-500' : ''}`}
                  >
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.paymentType && <p className="text-error-600 text-xs mt-1">{errors.paymentType}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Pembayaran *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className={`input ${errors.amount ? 'border-error-500' : ''}`}
                    placeholder="500000"
                  />
                  {errors.amount && <p className="text-error-600 text-xs mt-1">{errors.amount}</p>}
                  {formData.amount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.amount)}</p>
                  )}
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Pembayaran *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate.toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rekening Tujuan *
                  </label>
                  <select
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    className={`input ${errors.bankAccount ? 'border-error-500' : ''}`}
                  >
                    <option value="">Pilih Rekening Tujuan</option>
                    {bankAccounts.map(account => (
                      <option key={account} value={account}>{account}</option>
                    ))}
                  </select>
                  {errors.bankAccount && <p className="text-error-600 text-xs mt-1">{errors.bankAccount}</p>}
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Referensi/Transaksi *
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  className={`input ${errors.referenceNumber ? 'border-error-500' : ''}`}
                  placeholder="Nomor referensi dari bank"
                />
                {errors.referenceNumber && <p className="text-error-600 text-xs mt-1">{errors.referenceNumber}</p>}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bukti Pembayaran *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-primary-500 bg-primary-50' :
                    formData.proofFile ? 'border-success-500 bg-success-50' :
                      errors.proofFile ? 'border-error-500 bg-error-50' :
                        'border-gray-300 hover:border-gray-400'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {formData.proofFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-12 w-12 text-success-600 mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-success-800">{formData.proofFile.name}</p>
                        <p className="text-xs text-success-600">
                          {(formData.proofFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-primary-600 hover:text-primary-500"
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                          Klik untuk upload
                        </button>
                        <span className="text-gray-500"> atau drag & drop</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF maksimal 10MB
                      </p>
                    </div>
                  )}
                </div>
                {errors.proofFile && <p className="text-error-600 text-xs mt-1">{errors.proofFile}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Keterangan Bukti Transfer"
                />
              </div>

              {/* Important Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Catatan Penting</h4>
                    <ul className="mt-2 text-sm text-blue-800 space-y-1">
                      <li>• Pastikan bukti pembayaran jelas dan dapat dibaca</li>
                      <li>• Sertakan detail transaksi seperti tanggal, jumlah, dan nomor referensi</li>
                      <li>• Verifikasi Upload Pembayaran ke Admin / Bendahara</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Bukti Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofModal;