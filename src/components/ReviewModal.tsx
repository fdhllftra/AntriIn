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
import { Colors, Typography, Spacing, Radius, Layout } from '../constants';

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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Beri Rating Kapster</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Seberapa puas Anda dengan layanan {booking.barberName}?
          </Text>

          <View style={styles.starsBox}>
            <RatingInput value={rating} onChange={setRating} size={40} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Tulis komentar (opsional)..."
            placeholderTextColor={Colors.textLight}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={300}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  container: {
    backgroundColor: Colors.background,
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
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  starsBox: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 96,
    textAlignVertical: 'top',
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
});