import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: (silent?: boolean) => Promise<void>; // Added optional silent param
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Added 'silent' parameter. Defaults to false (show spinner).
  // If silent is true, we don't toggle isLoading, avoiding the flicker.
  const checkAuth = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (token) {
        // Verify with backend
        const response = await fetch('http://192.168.0.10:3000/cards', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setUserToken(token);
        } else {
          // Token expired on server -> Remove from client
          console.log('Token expired or invalid');
          await AsyncStorage.removeItem('userToken');
          setUserToken(null);
        }
      } else {
        setUserToken(null);
      }
    } catch (e) {
      console.error('Failed to verify token', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Run initial check on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const signIn = async (token: string) => {
    await AsyncStorage.setItem('userToken', token);
    setUserToken(token);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('userToken');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};