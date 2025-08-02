import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const ContactAdmin: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hubungi Admin</h1>
        <p className="text-gray-600 mt-2">
          Hubungi administrasi sekolah untuk pertanyaan atau bantuan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informasi Kontak */}
        <div className="space-y-6 lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Telepon</p>
                  <p className="text-gray-600">+62 8123 3466 497</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">rumahcahaya777@gmail.com</p>
                  <p className="text-gray-600">rumahcahaya705@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Alamat</p>
                  <p className="text-gray-600">
                    Perum Taman Raden Intan KAV.705,<br />
                    Malang, Jawa Timur,65126
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Jam Operasional */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Jam Operasional</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Senin - Jumat</p>
                  <p className="text-gray-600">07:00 - 16:00</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Sabtu - Minggu</p>
                  <p className="text-gray-600">Tutup</p>
                </div>
              </div>
            </div>
          </div>

          {/* Waktu Respons */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Waktu Respons</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <p>• <strong>Normal:</strong> 1-2 hari kerja</p>
              <p>• <strong>Tinggi:</strong> Dalam 24 jam</p>
              <p>• <strong>Mendesak:</strong> Dalam 4 jam</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
