import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { userToken, isLoading, checkAuth } = useAuth(); // Get checkAuth
  const segments = useSegments();
  const router = useRouter();

  // 1. Navigation Listener: Check auth silently whenever the route changes
  useEffect(() => {
    if (isLoading) return;

    // Check auth silently (pass true) so we don't show the spinner
    // If the token is invalid, checkAuth will set userToken to null...
    checkAuth(true); 
  }, [segments]); // Runs every time you navigate

  // 2. Protection Logic: Reacts to changes in userToken
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // ...which triggers this redirect automatically
    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (userToken && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [userToken, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}