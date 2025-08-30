import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export interface UserData extends FirebaseUser {
  role?: 'user' | 'mechanic' | 'admin';
  name?: string;
  email: string;
  phone?: string;
  employer?: string;
}

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser({ ...user, ...userDoc.data() } as UserData);
          } else {
            // If user doc doesn't exist, sign out
            await auth.signOut();
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { currentUser, loading };
};

export const useRoleRedirect = () => {
  const { currentUser, loading } = useAuth();
  
  const getRedirectPath = (user = currentUser): string => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'mechanic':
        return '/worker';
      case 'user':
      default:
        return '/dashboard';
    }
  };

  const redirectToRoleDashboard = (navigate: (path: string) => void) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const path = getRedirectPath(currentUser);
    console.log('Redirecting to:', path);
    navigate(path);
  };

  return { 
    currentUser, 
    loading, 
    getRedirectPath,
    redirectToRoleDashboard 
  };
};
