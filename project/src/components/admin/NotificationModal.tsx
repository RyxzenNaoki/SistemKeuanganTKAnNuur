import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../contexts/ToastContext';

interface NotificationFormProps {
  // Di AddNotificationModal.tsx
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => Promise<void>;
}

const NotificationModal = ({ isOpen, onClose, onAdded }: NotificationFormProps) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        createdAt: serverTimestamp(),
      });
      showToast('success', 'Pemberitahuan berhasil ditambahkan');
      onAdded();
      onClose();
    } catch (error) {
      console.error('Gagal menambahkan pemberitahuan:', error);
      showToast('error', 'Gagal menambahkan pemberitahuan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="text-lg font-semibold mb-4">Tambah Pemberitahuan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Judul</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pesan</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
);
};

export default NotificationModal;
