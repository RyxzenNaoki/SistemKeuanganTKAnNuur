import React, { useState } from 'react';
import { Send, Phone, Mail, MapPin, Clock, CheckCircle, Plus, MessageSquare } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import ContactAdminModal from '../../components/parent/ContactAdminModal';

interface Message {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  message: string;
  status: 'sent' | 'read' | 'replied';
  sentAt: Date;
  reply?: string;
  repliedAt?: Date;
}

const ContactAdmin: React.FC = () => {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Sample data - replace with actual data from Firebase
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      subject: 'Pertanyaan tentang jadwal kegiatan',
      category: 'schedule',
      priority: 'normal',
      message: 'Selamat pagi, saya ingin menanyakan tentang jadwal kegiatan Hari Anak yang akan dilaksanakan bulan depan. Apakah ada persiapan khusus yang perlu dilakukan?',
      status: 'replied',
      sentAt: new Date('2025-06-10'),
      reply: 'Selamat pagi Bapak/Ibu. Kegiatan Hari Anak akan dilaksanakan pada tanggal 23 Juli 2025. Untuk persiapan, anak-anak diminta membawa kostum sesuai tema yang akan diinformasikan minggu depan. Terima kasih.',
      repliedAt: new Date('2025-06-10'),
    },
    {
      id: '2',
      subject: 'Konfirmasi pembayaran SPP',
      category: 'payment',
      priority: 'high',
      message: 'Saya sudah melakukan pembayaran SPP bulan Juni kemarin, tetapi status di sistem masih menunjukkan belum lunas. Mohon bantuannya untuk mengecek.',
      status: 'read',
      sentAt: new Date('2025-06-12'),
    },
  ]);

  const handleSendMessage = async (data: any) => {
    try {
      setModalLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newMessage: Message = {
        id: Date.now().toString(),
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        message: data.message,
        status: 'sent',
        sentAt: new Date(),
      };
      
      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return (
          <span className="badge badge-secondary">
            Terkirim
          </span>
        );
      case 'read':
        return (
          <span className="badge badge-warning">
            Dibaca
          </span>
        );
      case 'replied':
        return (
          <span className="badge badge-success flex items-center w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Dibalas
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: Message['priority']) => {
    switch (priority) {
      case 'low':
        return <span className="badge bg-gray-100 text-gray-800">Rendah</span>;
      case 'normal':
        return <span className="badge bg-blue-100 text-blue-800">Normal</span>;
      case 'high':
        return <span className="badge bg-orange-100 text-orange-800">Tinggi</span>;
      case 'urgent':
        return <span className="badge bg-red-100 text-red-800">Mendesak</span>;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sentCount = messages.filter(msg => msg.status === 'sent').length;
  const readCount = messages.filter(msg => msg.status === 'read').length;
  const repliedCount = messages.filter(msg => msg.status === 'replied').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hubungi Admin</h1>
        <p className="text-gray-600 mt-2">
          Hubungi administrasi sekolah untuk pertanyaan atau bantuan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Terkirim</p>
                  <p className="text-2xl font-bold text-gray-900">{sentCount}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Send className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dibaca</p>
                  <p className="text-2xl font-bold text-warning-600">{readCount}</p>
                </div>
                <div className="p-2 bg-warning-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dibalas</p>
                  <p className="text-2xl font-bold text-success-600">{repliedCount}</p>
                </div>
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Send Message Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Pesan</h2>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Kirim Pesan Baru
            </button>
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="card p-6">
                <div className="space-y-4">
                  {/* Message Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{message.subject}</h3>
                      <p className="text-sm text-gray-500">{formatDate(message.sentAt)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(message.priority)}
                      {getStatusBadge(message.status)}
                    </div>
                  </div>

                  {/* Original Message */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{message.message}</p>
                  </div>

                  {/* Reply */}
                  {message.reply && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-blue-900">Balasan Admin</span>
                        <span className="text-xs text-blue-600">
                          {message.repliedAt && formatDate(message.repliedAt)}
                        </span>
                      </div>
                      <p className="text-blue-800">{message.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada pesan</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Kirim pesan pertama Anda kepada admin sekolah.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 btn btn-primary flex items-center mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Kirim Pesan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information Sidebar */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Telepon</p>
                  <p className="text-gray-600">+62 21 1234 5678</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">admin@tkceria.com</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Alamat</p>
                  <p className="text-gray-600">
                    Jl. Pendidikan No. 123<br />
                    Jakarta Selatan, 12345
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Office Hours */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Jam Operasional</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Senin - Jumat</p>
                  <p className="text-gray-600">08:00 - 16:00</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Sabtu</p>
                  <p className="text-gray-600">08:00 - 12:00</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Minggu</p>
                  <p className="text-gray-600">Tutup</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Waktu Respons</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <p>• <strong>Normal:</strong> 1-2 hari kerja</p>
              <p>• <strong>Tinggi:</strong> Dalam 24 jam</p>
              <p>• <strong>Mendesak:</strong> Dalam 4 jam</p>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="card p-6">
            <h4 className="font-medium text-gray-900 mb-2">Pertanyaan Umum</h4>
            <p className="text-sm text-gray-600 mb-3">
              Cek daftar pertanyaan yang sering diajukan sebelum mengirim pesan.
            </p>
            <button className="btn btn-secondary w-full">
              Lihat FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Contact Admin Modal */}
      <ContactAdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSendMessage}
        loading={modalLoading}
      />
    </div>
  );
};

export default ContactAdmin;