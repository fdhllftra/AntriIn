import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CustomerTabs, AdminTabs, RootStack } from './types';
import { CustomerNavigator } from './CustomerNavigator';
import { AdminNavigator } from './AdminNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';

export const AppNavigator: React.FC = () => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  if (isAdmin) {
    return <AdminNavigator />;
  }

  return <CustomerNavigator />;
};