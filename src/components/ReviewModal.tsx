import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createReview } from '../services/firestore';
import { Booking } from '../types';
import { Button } from './Button';
import { RatingInput } from './RatingInput';
import { Typography, Spacing, Radius, Layout } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface ReviewModalProps {
  visible: boolean;
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  booking,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Silakan pilih rating terlebih dahulu.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createReview({
        bookingId: booking.id,
        customerId: booking.customerId,
        barberId: booking.barberId,
        rating,
        comment: comment.trim() || undefined,
      });
      setRating(0);
      setComment('');
      onSuccess();
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Beri Rating Kapster</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Seberapa puas Anda dengan layanan {booking.barberName}?
          </Text>

          <View style={styles.starsBox}>
            <RatingInput value={rating} onChange={setRating} size={40} />
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Tulis komentar (opsional)..."
            placeholderTextColor={colors.textLight}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={300}
          />

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Button
            title="Kirim Rating"
            size="lg"
            loading={submitting}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
  },
  subtitle: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  starsBox: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 96,
    textAlignVertical: 'top',
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  error: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
});