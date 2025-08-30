// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjQ0FChITRn9LSXCo0HM59w5BBOQRrBcA",
  authDomain: "roadguard-98f42.firebaseapp.com",
  projectId: "roadguard-98f42",
  storageBucket: "roadguard-98f42.firebasestorage.app",
  messagingSenderId: "1048063809218",
  appId: "1:1048063809218:web:6acc9c2a9a6ccc2f6bcd5b",
  measurementId: "G-CG1FRWCQX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase services
export { auth, db };
