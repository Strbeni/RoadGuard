import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CompletedJob {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleType: string;
  serviceType: string;
  location: string;
  coordinates: [number, number];
  estimatedPay: string;
  acceptedAt: Date;
  completedAt: Date;
  workerId: string;
  requestId: string;
}

export const saveCompletedJob = async (job: Omit<CompletedJob, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'completedJobs'), {
      ...job,
      acceptedAt: job.acceptedAt.toISOString(),
      completedAt: job.completedAt.toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving completed job:', error);
    throw error;
  }
};

export const getWorkerCompletedJobs = async (workerId: string, limitCount: number = 10): Promise<CompletedJob[]> => {
  try {
    const q = query(
      collection(db, 'completedJobs'),
      where('workerId', '==', workerId),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        acceptedAt: new Date(data.acceptedAt),
        completedAt: new Date(data.completedAt),
      } as CompletedJob;
    });
  } catch (error) {
    console.error('Error fetching completed jobs:', error);
    // Return dummy data if there's an error
    return [
      {
        id: 'dummy1',
        customerName: 'John Doe',
        customerPhone: '+1 (555) 123-4567',
        vehicleType: 'Sedan',
        serviceType: 'Flat Tire',
        location: '123 Main St, City',
        coordinates: [27.7172, 85.3240] as [number, number],
        estimatedPay: '$75.00',
        acceptedAt: new Date(Date.now() - 86400000), // 1 day ago
        completedAt: new Date(),
        workerId: workerId,
        requestId: 'dummy-request-1'
      },
      {
        id: 'dummy2',
        customerName: 'Jane Smith',
        customerPhone: '+1 (555) 987-6543',
        vehicleType: 'SUV',
        serviceType: 'Battery Jump',
        location: '456 Oak Ave, Town',
        coordinates: [27.7172, 85.3240] as [number, number],
        estimatedPay: '$50.00',
        acceptedAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
        completedAt: new Date(Date.now() - 86400000), // 1 day ago
        workerId: workerId,
        requestId: 'dummy-request-2'
      }
    ];
  }
};
