import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CowsScreen from './src/screens/CowsScreen';
import CowDetailScreen from './src/screens/CowDetailScreen';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CowsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#14532d' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="CowsList" component={CowsScreen} options={{ title: 'Cows 🐄' }} />
      <Stack.Screen name="CowDetail" component={CowDetailScreen} options={{ title: 'Cow Details' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { t } = useApp();
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor: '#15803d',
      tabBarStyle: { backgroundColor: '#fff' },
      headerStyle: { backgroundColor: '#14532d' },
      headerTintColor: '#fff',
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ title: t('dashboard'), tabBarLabel: t('dashboard'), tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="Cows" component={CowsStack}
        options={{ title: t('cows'), tabBarLabel: t('cows'), headerShown: false, tabBarIcon: () => <Text>🐄</Text> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useApp();
  if (isLoading) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </QueryClientProvider>
  );
}
