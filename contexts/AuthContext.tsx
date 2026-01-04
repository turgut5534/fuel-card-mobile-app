import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // await AsyncStorage.removeItem('userToken');
        const token = await AsyncStorage.getItem('userToken');

        console.log('Checking auth with token:', token);
        
        if (token) {
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
            await AsyncStorage.removeItem('userToken');
            setUserToken(null);
          }
        }
      } catch (e) {
        console.error('Failed to verify token', e);
      } finally {
        setIsLoading(false);
      }
    };

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
    <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut }}>
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