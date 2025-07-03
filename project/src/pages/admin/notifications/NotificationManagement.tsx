import { useEffect, useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import NotificationModal from '../../../components/admin/NotificationModal';
import { useToast } from '../../../contexts/ToastContext';
import dayjs from 'dayjs';

interface Notification {
  id?: string;
  title: string;
  message: string;
  createdAt: Date;
}

const NotificationManagement = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notifSnap = await getDocs(collection(db, 'notifications'));
      const notifs: Notification[] = notifSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showToast('error', 'Gagal memuat pemberitahuan');
    } finally {
      setLoading(false);
    }
  };
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifSnap = await getDocs(collection(db, 'notifications'));
      const notifs: Notification[] = notifSnap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Notification),
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showToast('error', 'Gagal memuat pemberitahuan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return showToast('error', 'ID notifikasi tidak valid');
    try {
      await deleteDoc(doc(db, 'notifications', id));
      showToast('success', 'Pemberitahuan berhasil dihapus');
      fetchNotifications();
    } catch (error) {
      console.error('Gagal menghapus :', error);
      showToast('error', 'Gagal menghapus notifikasi');
    }
  };



  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="page-transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pemberitahuan</h1>
          <p className="text-gray-600">Tambah atau tinjau pemberitahuan yang akan tampil di dashboard</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Tambah Pemberitahuan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Belum ada pemberitahuan</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="card p-4">

              <h3 className="text-lg font-semibold text-gray-800">{notif.title}</h3>
              <p className="text-gray-600 text-sm mb-1">{notif.message}</p>
              <p className="text-xs text-gray-400">{dayjs(notif.createdAt).format('DD MMM YYYY, HH:mm')}</p>
              <button
                onClick={() => handleDelete(notif.id)}
                className="absolute top-2 right-2 text-sm text-red-500 hover:underline">
                Hapus
              </button>
            </div>

          ))}

        </div>
      )}

      <NotificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdded={loadNotifications}
      />
    </div>
  );
};

export default NotificationManagement;
