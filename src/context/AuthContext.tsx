'use client';

import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect 
} from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '@/firebase/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Define User type
interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

// Define children prop type
interface AuthProviderProps {
  children: React.ReactNode;
}

// Define context type
interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  loading: true
});

// This function will create a Firestore document for a user
const createUserDocumentIfNeeded = async (user: FirebaseUser) => {
  if (!user) return;
  
  try {
    console.log('Checking if user document exists for:', user.uid);
    
    // Check if the user document already exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Document doesn't exist, create it
      console.log('User document not found, creating new document for:', user.uid);
      
      const userData = {
        email: user.email,
        userId: user.uid,
        displayName: user.email?.split('@')[0] || 'User',
        createdAt: Date.now(), // Use timestamp instead of Date object
        lastLogin: Date.now()
      };
      
      await setDoc(userDocRef, userData);
      console.log('User document created successfully in Firestore');
    } else {
      console.log('User document already exists for:', user.uid);
      
      // Optionally update the lastLogin field
      await setDoc(userDocRef, { lastLogin: Date.now() }, { merge: true });
      console.log('Updated lastLogin timestamp');
    }
  } catch (error) {
    console.error('Error checking/creating user document:', error);
  }
};

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Signup function with better error handling
  const signup = async (email: string, password: string) => {
    try {
      console.log('Starting signup process for email:', email);
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created in Authentication:', user.uid);
      
      // Create a user document in Firestore
      const userData = {
        email: user.email,
        createdAt: Date.now(), // Use timestamp instead of Date object
        lastLogin: Date.now(),
        displayName: email.split('@')[0], // Simple display name from email
        userId: user.uid // Explicitly store the user ID
      };
      
      console.log('Creating user document in Firestore:', userData);
      
      // Use try/catch specifically for the database operation
      try {
        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('User document created successfully in Firestore');
      } catch (dbError) {
        console.error('Failed to create user document in Firestore:', dbError);
        // Continue despite the error - user is still authenticated
      }
      
      return;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Login function with document creation if needed
  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful for user:', userCredential.user.uid);
      
      // Try to create a user document if it doesn't exist
      await createUserDocumentIfNeeded(userCredential.user);
      
      return;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Logging out user');
      await signOut(auth);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        
        // Convert Firebase user to our User type
        const authUser: User = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
        setCurrentUser(authUser);
        
        // Try to create a user document if it doesn't exist
        createUserDocumentIfNeeded(user);
      } else {
        console.log('No user authenticated');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Context value
  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}