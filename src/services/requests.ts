import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Request {
  id?: string;
  userId: string;
  serviceType: string;
  vehicleType: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  urgency: 'low' | 'normal' | 'high';
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
  assignedTo?: string;
}

/**
 * Fetches all service requests for a specific user
 * @param userId - The ID of the user to fetch requests for
 * @returns Promise with an array of user's service requests
 */
export const getRequests = async (userId: string): Promise<Request[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const q = query(
      collection(db, 'requests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Request));
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

/**
 * Creates a new service request
 * @param requestData - The request data to create
 * @returns Promise with the created request
 */
export const createRequest = async (requestData: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Request> => {
  try {
    console.log('Creating request with data:', requestData);
    
    // Validate required fields
    if (!requestData.userId) {
      throw new Error('User ID is required');
    }
    if (!requestData.serviceType) {
      throw new Error('Service type is required');
    }
    if (!requestData.vehicleType) {
      throw new Error('Vehicle type is required');
    }

    const requestWithTimestamps = {
      ...requestData,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('Request with timestamps:', requestWithTimestamps);
    
    // Check if db is properly initialized
    if (!db) {
      console.error('Firestore database is not initialized');
      throw new Error('Database connection error. Please try again later.');
    }

    // Check if user has permission to write to the database
    try {
      const docRef = await addDoc(collection(db, 'requests'), requestWithTimestamps);
      console.log('Document written with ID: ', docRef.id);
      
      // Return the created document with ID
      const createdRequest = {
        id: docRef.id,
        ...requestWithTimestamps,
      };
      
      console.log('Created request:', createdRequest);
      return createdRequest;
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      if (firestoreError instanceof Error) {
        // Add more specific error handling for Firestore errors
        if (firestoreError.message.includes('permission-denied')) {
          throw new Error('You do not have permission to create requests.');
        }
        if (firestoreError.message.includes('unauthenticated')) {
          throw new Error('You must be logged in to create a request.');
        }
      }
      throw firestoreError;
    }
  } catch (error) {
    console.error('Error in createRequest:', error);
    if (error instanceof Error) {
      throw error; // Re-throw the error to be handled by the caller
    }
    throw new Error('An unknown error occurred while creating the request.');
  }
};
