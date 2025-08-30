import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification, subscribeNotifications, markAllAsRead } from '@/services/notifications';
import { auth } from '@/firebase';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) return;

    const unsub = subscribeNotifications(uid, setNotifications, console.error);
    return () => unsub();
  }, [auth.currentUser?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAll = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await markAllAsRead(uid);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAll }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};
