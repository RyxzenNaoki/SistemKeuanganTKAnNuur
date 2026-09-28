import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const ContactAdmin: React.FC = () => {
  return (
    <div className="space-y-8 px-4 md:px-8 py-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Hubungi Admin</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Silakan hubungi admin sekolah untuk bantuan atau pertanyaan terkait kegiatan dan keuangan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informasi Kontak (lebih besar) */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Informasi Kontak</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Phone className="text-primary-600 mt-1" />
              <div>
                <p className="text-lg font-medium text-slate-900">Telepon</p>
                <p className="text-slate-700">+62 8123 3466 497</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="text-primary-600 mt-1" />
              <div>
                <p className="text-lg font-medium text-slate-900">Email</p>
                <p className="text-slate-700">rumahcahaya777@gmail.com</p>
                <p className="text-slate-700">rumahcahaya705@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="text-primary-600 mt-1" />
              <div>
                <p className="text-lg font-medium text-slate-900">Alamat</p>
                <p className="text-slate-700 leading-relaxed">
                  Perum. Taman Raden Intan KAV. 705<br />
                  Malang, Jawa Timur, 65126
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jam Operasional & Respons */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Jam Operasional</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Senin - Jumat</span>
                <span>07:00 - 16:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sabtu -  Minggu</span>
                <span>Tutup</span>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 shadow-soft">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Waktu Respons</h3>
            <ul className="text-primary-800 text-sm space-y-1 pl-4 list-disc">
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
