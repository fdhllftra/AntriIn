import React from 'react';
import { AdminTabs } from './types';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { ServicesScreen } from '../screens/admin/ServicesScreen';
import { BarbersScreen } from '../screens/admin/BarbersScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';

export const AdminNavigator: React.FC = () => {
  return (
    <AdminTabs.Navigator>
      <AdminTabs.Screen name="Dashboard" component={DashboardScreen} />
      <AdminTabs.Screen name="Services" component={ServicesScreen} />
      <AdminTabs.Screen name="Barbers" component={BarbersScreen} />
      <AdminTabs.Screen name="Profile" component={ProfileScreen} />
    </AdminTabs.Navigator>
  );
};