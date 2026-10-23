import { auth } from '../firebase/config';

// Meminta server (/api/notify) mengirim notifikasi push. Dipanggil setelah aksi
// yang relevan berhasil. TIDAK PERNAH melempar error: kegagalan notifikasi tidak
// boleh membatalkan aksi utamanya (menyimpan pengumuman, tagihan, dsb.).
export type PushEvent =
  | { event: 'announcement'; payload: { title: string; message: string } }
  | { event: 'payment-assigned'; payload: { paymentId: string } }
  | { event: 'proof-submitted'; payload: { proofId: string } }
  | { event: 'proof-reviewed'; payload: { proofId: string } };

export const sendPush = async (evt: PushEvent): Promise<void> => {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(evt),
    });
    if (!res.ok) console.warn('Notifikasi push tidak terkirim:', res.status);
  } catch (err) {
    console.warn('Notifikasi push gagal:', err);
  }
};
