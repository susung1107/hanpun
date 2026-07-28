import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { AccountScreen } from '../screens/AccountScreen';
import { AddRecurringScreen } from '../screens/AddRecurringScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { BudgetScreen } from '../screens/BudgetScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { TransactionEditScreen } from '../screens/TransactionEditScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeProvider';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { tokens, isDark } = useTheme();
  const user = useAuthStore(state => state.user);

  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: tokens.primary,
      background: tokens.page,
      card: tokens.surface,
      text: tokens.ink,
      border: tokens.line,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.page } }}>
        {user ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
            <Stack.Screen name="TransactionEdit" component={TransactionEditScreen} />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Recurring" component={RecurringScreen} />
            <Stack.Screen
              name="AddRecurring"
              component={AddRecurringScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Budget" component={BudgetScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
