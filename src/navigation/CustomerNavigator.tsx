import React from 'react';
import { CustomerTabs } from './types';
import { HomeScreen } from '../screens/customer/HomeScreen';
import { HistoryScreen } from '../screens/customer/HistoryScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { BookingStackNavigator } from './BookingStackNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';

const TabIcon: React.FC<{ name: string; label: string; focused: boolean }> = ({
  name,
  label,
  focused,
}) => {
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
      color={focused ? Colors.primary : Colors.textLight}
    />
  );
};

export const CustomerNavigator: React.FC = () => {
  return (
    <CustomerTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
      })}>
      <CustomerTabs.Screen name="Home" component={HomeScreen} />
      <CustomerTabs.Screen name="Booking" component={BookingStackNavigator} />
      <CustomerTabs.Screen name="History" component={HistoryScreen} />
      <CustomerTabs.Screen name="Profile" component={ProfileScreen} />
    </CustomerTabs.Navigator>
  );
};