import { useState } from 'react';
import { CreditCard, Building, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface PaymentOption {
  id: string;
  type: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'overdue';
}

interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

const MakePayment = () => {
  const { showToast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');

  // Sample payment options - replace with actual data from Firebase
  const [paymentOptions] = useState<PaymentOption[]>([
    {
      id: '1',
      type: 'SPP Bulanan',
      description: 'SPP Bulan Juli 2025',
      amount: 500000,
      dueDate: '2025-07-10',
      status: 'upcoming',
    },
    {
      id: '2',
      type: 'Uang Kegiatan',
      description: 'Kegiatan Hari Anak',
      amount: 150000,
      dueDate: '2025-07-15',
      status: 'upcoming',
    },
  ]);

  // Bank account information
  const bankAccounts: BankAccount[] = [
    {
      bank: 'Bank BCA',
      accountNumber: '1234567890',
      accountName: 'TK Ceria',
    },
    {
      bank: 'Bank Mandiri',
      accountNumber: '0987654321',
      accountName: 'TK Ceria',
    },
    {
      bank: 'Bank BRI',
      accountNumber: '1122334455',
      accountName: 'TK Ceria',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('success', 'Nomor rekening berhasil disalin!');
    }).catch(() => {
      showToast('error', 'Gagal menyalin nomor rekening');
    });
  };

  const getStatusBadge = (status: PaymentOption['status']) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="badge badge-warning flex items-center w-fit">
            <AlertCircle className="h-3 w-3 mr-1" />
            Akan Datang
          </span>
        );
      case 'overdue':
        return (
          <span className="badge badge-error flex items-center w-fit">
            <AlertCircle className="h-3 w-3 mr-1" />
            Terlambat
          </span>
        );
    }
  };

  const selectedPaymentData = paymentOptions.find(p => p.id === selectedPayment);
  const selectedBankData = bankAccounts.find(b => b.bank === selectedBank);

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
        <p className="text-gray-600">Lakukan pembayaran SPP dan biaya sekolah lainnya</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Select Payment */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Pembayaran</h2>
            <div className="space-y-4">
              {paymentOptions.map((payment) => (
                <div
                  key={payment.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPayment === payment.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPayment(payment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="radio"
                          name="payment"
                          value={payment.id}
                          checked={selectedPayment === payment.id}
                          onChange={() => setSelectedPayment(payment.id)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <h3 className="font-medium text-gray-900">{payment.type}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{payment.description}</p>
                      <div className="flex items-center justify-between mt-2 ml-6">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Jatuh tempo: {formatDate(payment.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Selection */}
          {selectedPayment && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Bank Tujuan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bankAccounts.map((bank) => (
                  <div
                    key={bank.bank}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedBank === bank.bank
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBank(bank.bank)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="radio"
                        name="bank"
                        value={bank.bank}
                        checked={selectedBank === bank.bank}
                        onChange={() => setSelectedBank(bank.bank)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <Building className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{bank.bank}</span>
                    </div>
                    <div className="ml-7">
                      <p className="text-sm text-gray-600">{bank.accountName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-mono text-gray-900">{bank.accountNumber}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(bank.accountNumber);
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Salin nomor rekening"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pembayaran</h2>
            
            {selectedPaymentData ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900">{selectedPaymentData.type}</h3>
                  <p className="text-sm text-gray-600">{selectedPaymentData.description}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Jumlah Pembayaran:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedPaymentData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Jatuh Tempo:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedPaymentData.dueDate)}
                    </span>
                  </div>
                  {selectedBankData && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bank Tujuan:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedBankData.bank}
                      </span>
                    </div>
                  )}
                </div>

                {selectedBankData && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Detail Rekening</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Nomor Rekening:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono font-medium text-gray-900">
                              {selectedBankData.accountNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(selectedBankData.accountNumber)}
                              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                              title="Salin nomor rekening"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Nama Penerima:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedBankData.accountName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-gray-900">Total Bayar:</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(selectedPaymentData.amount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Pilih Pembayaran</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Pilih jenis pembayaran yang ingin Anda lakukan
                </p>
              </div>
            )}
          </div>

          {/* Payment Instructions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cara Pembayaran</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">1</span>
                </div>
                <p className="text-sm text-gray-600">Pilih jenis pembayaran dan bank tujuan</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">2</span>
                </div>
                <p className="text-sm text-gray-600">Transfer sesuai nominal yang tertera</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">3</span>
                </div>
                <p className="text-sm text-gray-600">Simpan bukti transfer</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">4</span>
                </div>
                <p className="text-sm text-gray-600">Upload bukti di menu "Upload Bukti"</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">5</span>
                </div>
                <p className="text-sm text-gray-600">Tunggu konfirmasi dari admin</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="card p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Catatan Penting</h3>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>• Transfer harus sesuai dengan nominal yang tertera</li>
                  <li>• Simpan bukti transfer untuk keperluan verifikasi</li>
                  <li>• Pembayaran akan dikonfirmasi dalam 1x24 jam</li>
                  <li>• Hubungi admin jika ada kendala pembayaran</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakePayment;