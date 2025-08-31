import { collection, getDocs, query, where, getCountFromServer, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'mechanic' | 'admin';
  createdAt: Date;
  status?: 'active' | 'inactive';
}

export interface ServiceRequest {
  id: string;
  userId: string;
  userName: string;
  serviceType: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  location: string;
  createdAt: Date;
  estimatedPay?: number;
}

export interface AnalyticsData {
  totalUsers: number;
  totalWorkers: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  revenue?: number;
}

export const adminService = {
  // Get all users with a specific role
  async getUsersByRole(role: 'user' | 'mechanic' | 'admin'): Promise<UserData[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as UserData[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get all service requests
  async getServiceRequests(): Promise<ServiceRequest[]> {
    try {
      const requestsRef = collection(db, 'serviceRequests');
      const querySnapshot = await getDocs(requestsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as ServiceRequest[];
    } catch (error) {
      console.error('Error fetching service requests:', error);
      throw error;
    }
  },

  // Get analytics data
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const [usersCount, workersCount, requestsCount] = await Promise.all([
        this.getUserCount('user'),
        this.getUserCount('mechanic'),
        this.getRequestCounts()
      ]);

      return {
        totalUsers: usersCount,
        totalWorkers: workersCount,
        totalRequests: requestsCount.total,
        completedRequests: requestsCount.completed,
        pendingRequests: requestsCount.pending,
        // Add revenue calculation if available
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Helper: Get user count by role
  async getUserCount(role: string): Promise<number> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  // Helper: Get request counts
  async getRequestCounts(): Promise<{total: number, completed: number, pending: number}> {
    const requestsRef = collection(db, 'serviceRequests');
    const [total, completed, pending] = await Promise.all([
      getCountFromServer(requestsRef),
      getCountFromServer(query(requestsRef, where('status', '==', 'completed'))),
      getCountFromServer(query(requestsRef, where('status', '==', 'pending')))
    ]);

    return {
      total: total.data().count,
      completed: completed.data().count,
      pending: pending.data().count
    };
  }
};
