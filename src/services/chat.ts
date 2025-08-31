import { db } from "../lib/firebase";
import { collection, doc, addDoc, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";

export interface Message {
  id?: string;
  requestId: string;
  senderId: string;
  senderName: string;
  text: string;  // This is the message content
  timestamp: any;
  read: boolean;
}

export const sendMessage = async (message: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<void> => {
  try {
    await addDoc(collection(db, 'messages'), {
      ...message,
      timestamp: serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const subscribeToMessages = (
  requestId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .filter(doc => doc.data().requestId === requestId)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          requestId: data.requestId,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text || data.message || '', // Handle both text and message fields
          timestamp: data.timestamp?.toDate(),
          read: data.read || false
        } as Message;
      });
    
    callback(messages);
  });
};

export const markMessagesAsRead = async (messageIds: string[]): Promise<void> => {
  if (messageIds.length === 0) return;
  
  try {
    const batch = writeBatch(db);
    
    messageIds.forEach(messageId => {
      const messageRef = doc(db, 'messages', messageId);
      batch.update(messageRef, { read: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};
