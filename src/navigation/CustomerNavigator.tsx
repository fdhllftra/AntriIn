import React from 'react';
import { CustomerTabs } from './types';
import { HomeScreen } from '../screens/customer/HomeScreen';
import { HistoryScreen } from '../screens/customer/HistoryScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { BookingStackNavigator } from './BookingStackNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const TabIcon: React.FC<{
  label: string;
  focused: boolean;
  color: string;
}> = ({ label, focused, color }) => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: focused ? 'home' : 'home-outline',
    Booking: focused ? 'calendar' : 'calendar-outline',
    History: focused ? 'time' : 'time-outline',
    Profile: focused ? 'person' : 'person-outline',
  };
  return (
    <Ionicons
      name={iconMap[label] ?? 'ellipse'}
      size={22}
      color={color}
    />
  );
};

export const CustomerNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <CustomerTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon label={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      })}>
      <CustomerTabs.Screen name="Home" component={HomeScreen} />
      <CustomerTabs.Screen name="Booking" component={BookingStackNavigator} />
      <CustomerTabs.Screen name="History" component={HistoryScreen} />
      <CustomerTabs.Screen name="Profile" component={ProfileScreen} />
    </CustomerTabs.Navigator>
  );
};