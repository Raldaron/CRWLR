// firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB2q9lWcgvWkfnH4XOQznHekEV-IWmlTWQ",
    authDomain: "crwlr-1ab86.firebaseapp.com",
    projectId: "crwlr-1ab86",
    storageBucket: "crwlr-1ab86.firebasestorage.app",
    messagingSenderId: "332671997627",
    appId: "1:332671997627:web:8630cc1b2da6a588eafb9e",
    measurementId: "G-NR1LTBL6H6"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to get server timestamp
const timestamp = serverTimestamp();

export { app, auth, db, timestamp };
