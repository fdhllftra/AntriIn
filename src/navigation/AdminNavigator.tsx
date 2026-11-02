import React from 'react';
import { AdminTabs } from './types';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { ServicesScreen } from '../screens/admin/ServicesScreen';
import { BarbersScreen } from '../screens/admin/BarbersScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const TabIcon: React.FC<{
  label: string;
  focused: boolean;
  color: string;
}> = ({ label, focused, color }) => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    Dashboard: focused ? 'grid' : 'grid-outline',
    Services: focused ? 'cut' : 'cut-outline',
    Barbers: focused ? 'people' : 'people-outline',
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

export const AdminNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <AdminTabs.Navigator
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
      <AdminTabs.Screen name="Dashboard" component={DashboardScreen} />
      <AdminTabs.Screen name="Services" component={ServicesScreen} />
      <AdminTabs.Screen name="Barbers" component={BarbersScreen} />
      <AdminTabs.Screen name="Profile" component={ProfileScreen} />
    </AdminTabs.Navigator>
  );
};