import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzchwSwCQidWKe0vUEHJmcfUx74GWi4VU",
  authDomain: "sistemkeuangantkannuur.firebaseapp.com",
  projectId: "sistemkeuangantkannuur",
  storageBucket: "sistemkeuangantkannuur.firebasestorage.app",
  messagingSenderId: "340341492650",
  appId: "1:340341492650:web:ef2107de44a915380d79d3",
  measurementId: "G-LN1X00BJFL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;