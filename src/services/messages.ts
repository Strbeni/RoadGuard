import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export interface RequestMessage {
  id?: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: any;
}

const col = () => collection(db, 'messages');

export const subscribeMessages = (
  requestId: string,
  onChange: (msgs: RequestMessage[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(col(), where('requestId', '==', requestId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const list: RequestMessage[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RequestMessage));
    onChange(list);
  }, onError);
};

// Optional helper to send a message; useful later if you allow workers to reply
export const sendMessage = async (payload: Omit<RequestMessage, 'id' | 'createdAt'>) => {
  await addDoc(col(), { ...payload, createdAt: serverTimestamp() });
};
