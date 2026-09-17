import React from 'react';
import { CustomerTabs } from './types';
import { HomeScreen } from '../screens/customer/HomeScreen';
import { BookingScreen } from '../screens/customer/BookingScreen';
import { HistoryScreen } from '../screens/customer/HistoryScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';

export const CustomerNavigator: React.FC = () => {
  return (
    <CustomerTabs.Navigator>
      <CustomerTabs.Screen name="Home" component={HomeScreen} />
      <CustomerTabs.Screen name="Booking" component={BookingScreen} />
      <CustomerTabs.Screen name="History" component={HistoryScreen} />
      <CustomerTabs.Screen name="Profile" component={ProfileScreen} />
    </CustomerTabs.Navigator>
  );
};