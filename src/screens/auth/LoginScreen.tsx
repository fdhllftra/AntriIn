import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Colors, Typography, Spacing, Layout } from '../../constants';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, isSigningIn, authError, clearAuthError } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <Ionicons name="cut" size={40} color={Colors.white} />
            </View>
            <Text style={styles.appName}>AntriIn</Text>
            <Text style={styles.tagline}>
              Booking barbershop tanpa antre panjang
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={Typography.h2}>Masuk ke AntriIn</Text>
            <Text style={styles.subtitle}>
              Pilih layanan, kapster, dan jam yang tersedia sebelum datang ke
              barbershop.
            </Text>

            {authError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <Button
              title="Lanjut dengan Google"
              onPress={() => {
                clearAuthError();
                signInWithGoogle();
              }}
              size="lg"
              loading={isSigningIn}
              style={styles.googleButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Login via WhatsApp (segera)"
              onPress={() => {}}
              variant="outline"
              size="lg"
              disabled
            />
          </View>

          <Text style={styles.footer}>
            Dengan masuk, Anda menyetujui Syarat & Ketentuan AntriIn
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: Layout.screenPadding,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.h1,
    color: Colors.primaryDark,
    fontSize: 32,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Colors.error,
    flex: 1,
  },
  googleButton: {
    marginTop: Spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  footer: {
    ...Typography.caption,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});