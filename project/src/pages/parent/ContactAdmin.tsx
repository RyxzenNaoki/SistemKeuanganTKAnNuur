import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const ContactAdmin: React.FC = () => {
  return (
    <div className="space-y-8 px-4 md:px-8 py-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hubungi Admin</h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Silakan hubungi admin sekolah untuk bantuan atau pertanyaan terkait kegiatan dan keuangan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informasi Kontak (lebih besar) */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Informasi Kontak</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Phone className="text-blue-600 mt-1" />
              <div>
                <p className="text-lg font-medium text-gray-900">Telepon</p>
                <p className="text-gray-700">+62 21 1234 5678</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="text-blue-600 mt-1" />
              <div>
                <p className="text-lg font-medium text-gray-900">Email</p>
                <p className="text-gray-700">admin@tkceria.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="text-blue-600 mt-1" />
              <div>
                <p className="text-lg font-medium text-gray-900">Alamat</p>
                <p className="text-gray-700 leading-relaxed">
                  Jl. Pendidikan No. 123<br />
                  Jakarta Selatan, 12345
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jam Operasional & Respons */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Jam Operasional</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Senin - Jumat</span>
                <span>08:00 - 16:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sabtu</span>
                <span>08:00 - 12:00</span>
              </div>
              <div className="flex justify-between">
                <span>Minggu</span>
                <span className="text-gray-500 italic">Tutup</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Waktu Respons</h3>
            <ul className="text-blue-800 text-sm space-y-1 pl-4 list-disc">
              <li><strong>Normal:</strong> 1–2 hari kerja</li>
              <li><strong>Tinggi:</strong> Dalam 24 jam</li>
              <li><strong>Mendesak:</strong> Dalam 4 jam</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
