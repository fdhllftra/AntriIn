import React from 'react';
import { BookingStack } from './types';
import { ServiceSelectionScreen } from '../screens/customer/booking/ServiceSelectionScreen';
import { BarberSelectionScreen } from '../screens/customer/booking/BarberSelectionScreen';
import { DateTimeSelectionScreen } from '../screens/customer/booking/DateTimeSelectionScreen';
import { ConfirmationScreen } from '../screens/customer/booking/ConfirmationScreen';
import { ETicketScreen } from '../screens/customer/booking/ETicketScreen';

export const BookingStackNavigator: React.FC = () => {
  return (
    <BookingStack.Navigator>
      <BookingStack.Screen
        name="ServiceSelection"
        component={ServiceSelectionScreen}
        options={{ title: 'Pilih Layanan' }}
      />
      <BookingStack.Screen
        name="BarberSelection"
        component={BarberSelectionScreen}
        options={{ title: 'Pilih Kapster' }}
      />
      <BookingStack.Screen
        name="DateTimeSelection"
        component={DateTimeSelectionScreen}
        options={{ title: 'Pilih Tanggal & Jam' }}
      />
      <BookingStack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ title: 'Konfirmasi Booking' }}
      />
      <BookingStack.Screen
        name="ETicket"
        component={ETicketScreen}
        options={{ title: 'E-Ticket', headerBackVisible: false }}
      />
    </BookingStack.Navigator>
  );
};