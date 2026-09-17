import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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
    selectedServices: string[];
    totalPrice: number;
  };
  DateTimeSelection: {
    selectedServices: string[];
    totalPrice: number;
    barberId: string;
  };
  Confirmation: {
    selectedServices: string[];
    totalPrice: number;
    barberId: string;
    date: string;
    timeSlot: string;
  };
  ETicket: {
    bookingId: string;
  };
};

export const RootStack = createNativeStackNavigator<RootStackParamList>();
export const CustomerTabs = createBottomTabNavigator<CustomerTabParamList>();
export const AdminTabs = createBottomTabNavigator<AdminTabParamList>();
export const BookingStack = createNativeStackNavigator<BookingStackParamList>();