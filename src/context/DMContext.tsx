// context/DMContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';

interface DMContextType {
  isDM: boolean;
  dmData?: {
    name: string;
  };
  isLoading: boolean;
  error: string | null;
}

const DMContext = createContext<DMContextType>({
  isDM: false,
  isLoading: true,
  error: null
});

interface DMProviderProps {
  children: React.ReactNode;
}

export const DMProvider: React.FC<DMProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isDM, setIsDM] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDMStatus = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First check user's profile
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().isDM) {
          setIsDM(true);
          setIsLoading(false);
          return;
        }
        
        // If not found in user profile, check game settings
        const gameSettingsRef = doc(db, 'gameSettings', 'dmConfig');
        const gameSettingsSnap = await getDoc(gameSettingsRef);
        
        if (gameSettingsSnap.exists()) {
          const gameData = gameSettingsSnap.data();
          const dmList = gameData.dmList || [];
          
          if (dmList.includes(currentUser.uid)) {
            setIsDM(true);
          } else {
            setIsDM(false);
          }
        } else {
          setIsDM(false);
        }
      } catch (err) {
        console.error('Error checking DM status:', err);
        setError('Failed to check DM status');
        setIsDM(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDMStatus();
  }, [currentUser]);

  const value = {
    isDM,
    isLoading,
    error
  };

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
};

export const useDM = () => useContext(DMContext);