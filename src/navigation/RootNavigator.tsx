import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RootStack } from './types';
import { AppNavigator } from './AppNavigator';

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator>
        {user ? (
          <RootStack.Screen
            name="CustomerTabs"
            component={AppNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <RootStack.Screen
            name="Login"
            component={AppNavigator}
            options={{ headerShown: false }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};