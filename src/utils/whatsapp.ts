import { Linking, Alert } from 'react-native';

export const WHATSAPP_NUMBER = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || '';

const sanitizeNumber = (raw: string): string => raw.replace(/[^\d]/g, '');

export const buildWhatsAppLink = (message: string): string => {
  const number = sanitizeNumber(WHATSAPP_NUMBER);
  const text = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${text}`;
};

export const openWhatsApp = async (message: string): Promise<void> => {
  if (!WHATSAPP_NUMBER) {
    Alert.alert(
      'WhatsApp belum dikonfigurasi',
      'Atur nomor WhatsApp barbershop di EXPO_PUBLIC_WHATSAPP_NUMBER.'
    );
    return;
  }
  const url = buildWhatsAppLink(message);
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Tidak dapat membuka WhatsApp', 'Pastikan WhatsApp terinstal di perangkat ini.');
    return;
  }
  Linking.openURL(url);
};