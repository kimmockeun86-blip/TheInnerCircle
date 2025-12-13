// Firebase configuration for ORBIT App
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDg6wzVcr1NtHblsgLhn7BbBit1GDnsqfw",
    authDomain: "orbit-920a0.firebaseapp.com",
    projectId: "orbit-920a0",
    storageBucket: "orbit-920a0.firebasestorage.app",
    messagingSenderId: "25356654664",
    appId: "1:25356654664:web:9d203a44a6509c96b6207d",
    measurementId: "G-L3B3XB8Q9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
