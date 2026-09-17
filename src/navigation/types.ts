import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Service, Barber, Booking } from '../types';

export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  CustomerTabs: undefined;
  AdminTabs: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Booking: undefined;
  History: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Services: undefined;
  Barbers: undefined;
  Profile: undefined;
};

export type BookingStackParamList = {
  ServiceSelection: undefined;
  BarberSelection: {
    services: Service[];
  };
  DateTimeSelection: {
    services: Service[];
    barber: Barber;
  };
  Confirmation: {
    services: Service[];
    barber: Barber;
    date: string;
    timeSlot: string;
  };
  ETicket: {
    booking: Booking;
  };
  Home: undefined;
};

export const RootStack = createNativeStackNavigator<RootStackParamList>();
export const CustomerTabs = createBottomTabNavigator<CustomerTabParamList>();
export const AdminTabs = createBottomTabNavigator<AdminTabParamList>();
export const BookingStack = createNativeStackNavigator<BookingStackParamList>();