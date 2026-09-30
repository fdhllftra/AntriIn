import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';
import { UserRole } from '../../types';

type AuthTab = 'whatsapp' | 'email';

export const LoginScreen: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithWhatsApp,
    signInWithGoogle,
    loginAsDemo,
    isSigningIn,
    authError,
    clearAuthError,
  } = useAuth();

  // Tab State: 'whatsapp' or 'email'
  const [activeTab, setActiveTab] = useState<AuthTab>('whatsapp');

  // Email sub-mode: 'login' or 'register'
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');

  // WhatsApp form states
  const [waPhone, setWaPhone] = useState('');
  const [waName, setWaName] = useState('');
  const [waRole, setWaRole] = useState<UserRole>('customer');
  const [waStep, setWaStep] = useState<'phone' | 'otp'>('phone');
  const [waOtp, setWaOtp] = useState('');

  // Email form states
  const [emailName, setEmailName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailRole, setEmailRole] = useState<UserRole>('customer');

  // Google Modal State for Expo Go development
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);

  const resetErrors = () => {
    clearAuthError();
    setLocalError(null);
  };

  // WhatsApp Handlers
  const handleRequestWaOtp = () => {
    resetErrors();
    const clean = waPhone.trim().replace(/\s+/g, '');
    if (!clean || clean.length < 8) {
      setLocalError('Harap masukkan nomor WhatsApp yang valid (min. 8 digit).');
      return;
    }
    setWaStep('otp');
    setWaOtp('123456'); // Pre-filled OTP for smooth testing in Expo Go
  };

  const handleVerifyWaLogin = async () => {
    resetErrors();
    if (!waOtp || waOtp.length < 4) {
      setLocalError('Harap masukkan kode OTP verifikasi.');
      return;
    }
    try {
      await signInWithWhatsApp(waPhone, waName, waRole);
    } catch {
      // Handled by context
    }
  };

  const handleSelectQuickWa = (phone: string, name: string, role: UserRole) => {
    setWaPhone(phone);
    setWaName(name);
    setWaRole(role);
    setWaStep('phone');
    resetErrors();
  };

  // Email Handlers
  const handleEmailLogin = async () => {
    resetErrors();
    if (!email.trim() || !password) {
      setLocalError('Harap isi email dan password.');
      return;
    }
    try {
      await signInWithEmail(email, password);
    } catch {
      // Handled by context
    }
  };

  const handleEmailRegister = async () => {
    resetErrors();
    if (!emailName.trim()) {
      setLocalError('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Format email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter.');
      return;
    }
    try {
      await signUpWithEmail(emailName, email, password, emailRole);
    } catch {
      // Handled by context
    }
  };

  // Google Handlers
  const handleGoogleCustomLogin = async (accEmail: string, accName: string) => {
    setShowGoogleModal(false);
    resetErrors();
    await signInWithGoogle({ email: accEmail, name: accName });
  };

  const errorMessage = localError || authError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Header & Logo */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <Ionicons name="cut" size={38} color={Colors.white} />
            </View>
            <Text style={styles.appName}>AntriIn</Text>
            <Text style={styles.tagline}>
              Solusi booking antrean barbershop modern & cepat
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Main Mode Switcher: WhatsApp vs Email */}
            <View style={styles.mainTabContainer}>
              <TouchableOpacity
                style={[
                  styles.mainTabButton,
                  activeTab === 'whatsapp' && styles.mainTabButtonActiveWa,
                ]}
                onPress={() => {
                  setActiveTab('whatsapp');
                  resetErrors();
                }}
                activeOpacity={0.85}>
                <Ionicons
                  name="logo-whatsapp"
                  size={18}
                  color={activeTab === 'whatsapp' ? Colors.white : '#25D366'}
                />
                <Text
                  style={[
                    styles.mainTabText,
                    activeTab === 'whatsapp' && styles.mainTabTextActive,
                  ]}>
                  No. WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mainTabButton,
                  activeTab === 'email' && styles.mainTabButtonActiveEmail,
                ]}
                onPress={() => {
                  setActiveTab('email');
                  resetErrors();
                }}
                activeOpacity={0.85}>
                <Ionicons
                  name="mail"
                  size={18}
                  color={activeTab === 'email' ? Colors.white : Colors.primary}
                />
                <Text
                  style={[
                    styles.mainTabText,
                    activeTab === 'email' && styles.mainTabTextActive,
                  ]}>
                  Email & Sandi
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Box */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* TAB CONTENT: WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <View>
                <View style={styles.infoBanner}>
                  <Ionicons name="flash" size={16} color="#047857" />
                  <Text style={styles.infoBannerText}>
                    Masuk instan tanpa perlu mengingat password!
                  </Text>
                </View>

                {waStep === 'phone' ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Nomor WhatsApp</Text>
                      <View style={styles.inputWrapper}>
                        <View style={styles.phonePrefix}>
                          <Text style={styles.phonePrefixText}>🇮🇩 +62</Text>
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder="81234567890"
                          placeholderTextColor={Colors.textLight}
                          value={waPhone}
                          onChangeText={setWaPhone}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Nama Anda (Opsional jika akun baru)
                      </Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={Colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Contoh: Budi Santoso"
                          placeholderTextColor={Colors.textLight}
                          value={waName}
                          onChangeText={setWaName}
                          autoCapitalize="words"
                        />
                      </View>
                    </View>

                    {/* Quick phone fillers from database */}
                    <Text style={styles.quickLabel}>Nomor Pengujian Cepat:</Text>
                    <View style={styles.quickPhoneRow}>
                      <TouchableOpacity
                        style={styles.quickPhoneChip}
                        onPress={() =>
                          handleSelectQuickWa('081234567890', 'Budi Santoso', 'customer')
                        }>
                        <Text style={styles.quickPhoneChipTitle}>0812-3456-7890</Text>
                        <Text style={styles.quickPhoneChipSub}>Pelanggan</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.quickPhoneChip}
                        onPress={() =>
                          handleSelectQuickWa('081298765432', 'Mas Hendra', 'admin')
                        }>
                        <Text style={styles.quickPhoneChipTitle}>0812-9876-5432</Text>
                        <Text style={styles.quickPhoneChipSub}>Admin</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Role Selection for testing */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Masuk Sebagai:</Text>
                      <View style={styles.roleContainer}>
                        <TouchableOpacity
                          style={[
                            styles.roleChip,
                            waRole === 'customer' && styles.roleChipActive,
                          ]}
                          onPress={() => setWaRole('customer')}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={waRole === 'customer' ? Colors.white : Colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.roleChipText,
                              waRole === 'customer' && styles.roleChipTextActive,
                            ]}>
                            Pelanggan
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.roleChip,
                            waRole === 'admin' && styles.roleChipActive,
                          ]}
                          onPress={() => setWaRole('admin')}>
                          <Ionicons
                            name="shield-checkmark"
                            size={16}
                            color={waRole === 'admin' ? Colors.white : Colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.roleChipText,
                              waRole === 'admin' && styles.roleChipTextActive,
                            ]}>
                            Admin Barbershop
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Button
                      title="Lanjut Masuk via WhatsApp"
                      onPress={handleRequestWaOtp}
                      size="lg"
                      loading={isSigningIn}
                      style={[styles.submitButton, { backgroundColor: '#10B981' }]}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.otpHeader}>
                      <Ionicons name="chatbubbles" size={32} color="#10B981" />
                      <Text style={styles.otpTitle}>Verifikasi Kode OTP</Text>
                      <Text style={styles.otpSubtitle}>
                        Kode verifikasi telah dikirim ke nomor WhatsApp{' '}
                        <Text style={{ fontWeight: '700', color: Colors.text }}>
                          {waPhone}
                        </Text>
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Kode OTP (6 Digit)</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="key-outline"
                          size={18}
                          color={Colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { letterSpacing: 4, fontWeight: '700' }]}
                          placeholder="123456"
                          placeholderTextColor={Colors.textLight}
                          value={waOtp}
                          onChangeText={setWaOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>

                    <View style={styles.otpNotice}>
                      <Ionicons name="information-circle" size={16} color="#047857" />
                      <Text style={styles.otpNoticeText}>
                        Mode Pengujian Expo: Kode otomatis terisi `123456`.
                      </Text>
                    </View>

                    <Button
                      title="Verifikasi & Masuk"
                      onPress={handleVerifyWaLogin}
                      size="lg"
                      loading={isSigningIn}
                      style={[styles.submitButton, { backgroundColor: '#10B981' }]}
                    />

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setWaStep('phone')}>
                      <Text style={styles.backButtonText}>← Ubah Nomor WhatsApp</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* TAB CONTENT: EMAIL */}
            {activeTab === 'email' && (
              <View>
                {/* Switcher Masuk / Daftar */}
                <View style={styles.subTabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.subTabButton,
                      emailMode === 'login' && styles.subTabButtonActive,
                    ]}
                    onPress={() => {
                      setEmailMode('login');
                      resetErrors();
                    }}>
                    <Text
                      style={[
                        styles.subTabText,
                        emailMode === 'login' && styles.subTabTextActive,
                      ]}>
                      Masuk
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.subTabButton,
                      emailMode === 'register' && styles.subTabButtonActive,
                    ]}
                    onPress={() => {
                      setEmailMode('register');
                      resetErrors();
                    }}>
                    <Text
                      style={[
                        styles.subTabText,
                        emailMode === 'register' && styles.subTabTextActive,
                      ]}>
                      Daftar Akun Baru
                    </Text>
                  </TouchableOpacity>
                </View>

                {emailMode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nama Lengkap</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={Colors.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Contoh: Budi Santoso"
                        placeholderTextColor={Colors.textLight}
                        value={emailName}
                        onChangeText={setEmailName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={Colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="nama@email.com"
                      placeholderTextColor={Colors.textLight}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={Colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={
                        emailMode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'
                      }
                      placeholderTextColor={Colors.textLight}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {emailMode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Daftar Sebagai:</Text>
                    <View style={styles.roleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.roleChip,
                          emailRole === 'customer' && styles.roleChipActive,
                        ]}
                        onPress={() => setEmailRole('customer')}>
                        <Ionicons
                          name="person"
                          size={16}
                          color={emailRole === 'customer' ? Colors.white : Colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.roleChipText,
                            emailRole === 'customer' && styles.roleChipTextActive,
                          ]}>
                          Pelanggan
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleChip,
                          emailRole === 'admin' && styles.roleChipActive,
                        ]}
                        onPress={() => setEmailRole('admin')}>
                        <Ionicons
                          name="shield-checkmark"
                          size={16}
                          color={emailRole === 'admin' ? Colors.white : Colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.roleChipText,
                            emailRole === 'admin' && styles.roleChipTextActive,
                          ]}>
                          Admin Barbershop
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Button
                  title={emailMode === 'login' ? 'Masuk dengan Email' : 'Daftar Sekarang'}
                  onPress={emailMode === 'login' ? handleEmailLogin : handleEmailRegister}
                  size="lg"
                  loading={isSigningIn}
                  style={styles.submitButton}
                />
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU MASUK DENGAN</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleCustomBtn}
              onPress={() => setShowGoogleModal(true)}
              activeOpacity={0.85}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleCustomBtnText}>Lanjut dengan Akun Google</Text>
            </TouchableOpacity>
          </View>

          {/* Quick 1-Click Demo Accounts for Testing */}
          <View style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="flask" size={18} color="#D97706" />
              <Text style={styles.demoTitle}>Akses Cepat Pengujian (1-Klik)</Text>
            </View>
            <Text style={styles.demoSubtitle}>
              Langsung masuk tanpa input form untuk mencoba semua fitur:
            </Text>

            <View style={styles.demoButtonRow}>
              <TouchableOpacity
                style={[styles.demoQuickBtn, styles.demoCustomerBtn]}
                onPress={() => loginAsDemo('customer')}
                disabled={isSigningIn}
                activeOpacity={0.85}>
                <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoBtnText}>Akun Pelanggan</Text>
                  <Text style={styles.demoBtnSub}>Budi Santoso</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoQuickBtn, styles.demoAdminBtn]}
                onPress={() => loginAsDemo('admin')}
                disabled={isSigningIn}
                activeOpacity={0.85}>
                <Ionicons name="shield-outline" size={24} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.demoBtnText, { color: '#059669' }]}>
                    Akun Admin
                  </Text>
                  <Text style={styles.demoBtnSub}>Mas Hendra</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>
            AntriIn • Sistem Pemesanan & Antrean Barbershop
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Account Modal (for seamless Expo Go testing) */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
              </View>
              <Text style={styles.modalTitle}>Masuk dengan Google</Text>
              <Text style={styles.modalDesc}>
                Pilih akun Google pengujian untuk masuk di Expo Go:
              </Text>
            </View>

            <TouchableOpacity
              style={styles.googleAccountItem}
              onPress={() =>
                handleGoogleCustomLogin('budi.santoso@gmail.com', 'Budi Santoso (Google)')
              }>
              <View style={styles.accountAvatar}>
                <Text style={styles.avatarLetter}>B</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>Budi Santoso</Text>
                <Text style={styles.accountEmail}>budi.santoso@gmail.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleAccountItem}
              onPress={() =>
                handleGoogleCustomLogin('hendra.barber@gmail.com', 'Hendra Barbershop (Google)')
              }>
              <View style={[styles.accountAvatar, { backgroundColor: '#10B981' }]}>
                <Text style={styles.avatarLetter}>H</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>Hendra Barbershop</Text>
                <Text style={styles.accountEmail}>hendra.barber@gmail.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            {/* Custom Google Email Input */}
            <View style={{ marginTop: Spacing.sm }}>
              <Text style={styles.inputLabel}>Atau Masukkan Email Google Lain:</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="nama.anda@gmail.com"
                  placeholderTextColor={Colors.textLight}
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {customGoogleEmail.trim().length > 3 ? (
                <Button
                  title="Gunakan Akun Ini"
                  onPress={() =>
                    handleGoogleCustomLogin(
                      customGoogleEmail.trim(),
                      customGoogleEmail.split('@')[0]
                    )
                  }
                  size="sm"
                  style={{ marginTop: Spacing.xs }}
                />
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGoogleModal(false)}>
              <Text style={styles.modalCloseText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  appName: {
    ...Typography.h1,
    color: Colors.primaryDark,
    fontSize: 26,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainTabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mainTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mainTabButtonActiveWa: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  mainTabButtonActiveEmail: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  mainTabText: {
    ...Typography.captionMedium,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  mainTabTextActive: {
    color: Colors.white,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoBannerText: {
    ...Typography.caption,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  subTabButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  subTabText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    height: 46,
  },
  phonePrefix: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
  },
  phonePrefixText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
    fontSize: 14,
  },
  eyeButton: {
    padding: 4,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    marginTop: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quickPhoneRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  quickPhoneChip: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  quickPhoneChipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  quickPhoneChipSub: {
    fontSize: 10,
    color: '#166534',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleChipTextActive: {
    color: Colors.white,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  otpHeader: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  otpTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  otpSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  otpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginVertical: Spacing.sm,
  },
  otpNoticeText: {
    ...Typography.small,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  backButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.5,
  },
  googleCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleCustomBtnText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  demoCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  demoSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginBottom: Spacing.sm,
  },
  demoButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  demoCustomerBtn: {
    borderColor: Colors.primaryLight,
  },
  demoAdminBtn: {
    borderColor: '#A7F3D0',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  demoBtnSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  footer: {
    ...Typography.caption,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: 11,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  modalDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  googleAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  accountName: {
    ...Typography.captionMedium,
    fontWeight: '700',
    color: Colors.text,
  },
  accountEmail: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  modalCloseButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  modalCloseText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});