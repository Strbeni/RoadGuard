import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

export type NotificationType = 'request_update' | 'assignment' | 'system';

export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: any;
  data?: Record<string, any>;
}

const col = () => collection(db, 'notifications');

export const sendNotification = async (userId: string, payload: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'read'> & { data?: Record<string, any> }) => {
  if (!userId) throw new Error('userId is required');
  await addDoc(col(), {
    userId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    read: false,
    data: payload.data || {},
    createdAt: serverTimestamp(),
  } as AppNotification);
};

export const subscribeNotifications = (
  userId: string,
  onChange: (notifs: AppNotification[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(col(), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: AppNotification[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
    onChange(list);
  }, onError);
};

export const markAsRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

export const markAllAsRead = async (userId: string) => {
  const q = query(col(), where('userId', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true })));
};
