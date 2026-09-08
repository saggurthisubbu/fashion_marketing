import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShopProvider } from '../context/ShopContext';
import Toast from '../components/Toast';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ShopProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#0f172a',
            headerTitleStyle: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{
              title: 'Product',
              headerBackTitle: 'Back',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="checkout"
            options={{
              title: 'Checkout',
              headerBackTitle: 'Bag',
              presentation: 'card',
            }}
          />
        </Stack>
        <Toast />
        <StatusBar style="dark" />
      </ShopProvider>
    </SafeAreaProvider>
  );
}
