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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Typography, Spacing, Layout, Radius } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { colors, isDark } = useTheme();

  // Tab State: 'whatsapp' or 'email'
  const [activeTab, setActiveTab] = useState<AuthTab>('whatsapp');

  // Email sub-mode: 'login' or 'register'
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');

  // WhatsApp form states
  const [waPhone, setWaPhone] = useState('');
  const [waName, setWaName] = useState('');
  const [waStep, setWaStep] = useState<'phone' | 'otp'>('phone');
  const [waOtp, setWaOtp] = useState('');

  // Email form states
  const [emailName, setEmailName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Discrete Testing Mode Toggle (Accordion)
  const [showDemoSection, setShowDemoSection] = useState(false);

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
    setWaOtp('123456'); // Pre-fill OTP for smooth testing in Expo Go
  };

  const handleVerifyWaLogin = async () => {
    resetErrors();
    if (!waOtp || waOtp.length < 4) {
      setLocalError('Harap masukkan kode OTP verifikasi.');
      return;
    }
    try {
      await signInWithWhatsApp(waPhone, waName, 'customer');
    } catch {
      // Handled by context
    }
  };

  // Email Handlers
  const handleEmailLogin = async () => {
    resetErrors();
    if (!email.trim() || !password) {
      setLocalError('Harap isi email dan password Anda.');
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
      await signUpWithEmail(emailName, email, password, 'customer');
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Header & Logo */}
          <View style={styles.hero}>
            <View style={[styles.logoContainer, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border }]}>
              <Image
                source={require('../../assets/images/app-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>AntriIn</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Booking Jadwal & Antrean Barbershop Tanpa Menunggu
            </Text>
          </View>

          {/* Main Auth Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Primary Tab Selector */}
            <View style={[styles.tabBar, { backgroundColor: isDark ? colors.surfaceVariant : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'whatsapp' && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  setActiveTab('whatsapp');
                  resetErrors();
                }}
                activeOpacity={0.85}>
                <Ionicons
                  name="logo-whatsapp"
                  size={16}
                  color={activeTab === 'whatsapp' ? colors.white : '#10B981'}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: activeTab === 'whatsapp' ? colors.white : colors.textSecondary,
                      fontWeight: activeTab === 'whatsapp' ? '700' : '500',
                    },
                  ]}>
                  WhatsApp (Instan)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'email' && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  setActiveTab('email');
                  resetErrors();
                }}
                activeOpacity={0.85}>
                <Ionicons
                  name="mail"
                  size={16}
                  color={activeTab === 'email' ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: activeTab === 'email' ? colors.white : colors.textSecondary,
                      fontWeight: activeTab === 'email' ? '700' : '500',
                    },
                  ]}>
                  Email & Sandi
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Notice */}
            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
              </View>
            )}

            {/* TAB: WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <View>
                {waStep === 'phone' ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Nomor WhatsApp</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={[styles.phonePrefix, { borderRightColor: colors.border }]}>
                          <Text style={[styles.phonePrefixText, { color: colors.text }]}>+62</Text>
                        </View>
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="81234567890"
                          placeholderTextColor={colors.textLight}
                          value={waPhone}
                          onChangeText={setWaPhone}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        Nama Anda <Text style={[styles.optionalTag, { color: colors.textSecondary }]}> (Opsional)</Text>
                      </Text>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Contoh: Budi Santoso"
                          placeholderTextColor={colors.textLight}
                          value={waName}
                          onChangeText={setWaName}
                          autoCapitalize="words"
                        />
                      </View>
                    </View>

                    <Button
                      title="Kirim Kode OTP WhatsApp"
                      onPress={handleRequestWaOtp}
                      size="lg"
                      loading={isSigningIn}
                      icon={<Ionicons name="paper-plane-outline" size={18} color={colors.white} />}
                      style={{ marginTop: Spacing.xs, backgroundColor: '#10B981' }}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.otpHeaderWrap}>
                      <View style={[styles.otpIconCircle, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="chatbubble-ellipses" size={28} color="#059669" />
                      </View>
                      <Text style={[styles.otpTitle, { color: colors.text }]}>Masukkan Kode OTP</Text>
                      <Text style={[styles.otpSub, { color: colors.textSecondary }]}>
                        Kode dikirim ke <Text style={{ fontWeight: '700', color: colors.text }}>{waPhone}</Text>
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Ionicons
                          name="key-outline"
                          size={18}
                          color={colors.textSecondary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.text, letterSpacing: 6, fontWeight: '700' }]}
                          placeholder="123456"
                          placeholderTextColor={colors.textLight}
                          value={waOtp}
                          onChangeText={setWaOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>

                    <Button
                      title="Verifikasi & Masuk"
                      onPress={handleVerifyWaLogin}
                      size="lg"
                      loading={isSigningIn}
                      style={{ backgroundColor: '#10B981' }}
                    />

                    <TouchableOpacity
                      style={styles.changePhoneBtn}
                      onPress={() => setWaStep('phone')}>
                      <Text style={[styles.changePhoneText, { color: colors.primary }]}>
                        ← Ganti Nomor WhatsApp
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* TAB: EMAIL */}
            {activeTab === 'email' && (
              <View>
                {/* Switcher Masuk vs Daftar */}
                <View style={styles.subModeRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setEmailMode('login');
                      resetErrors();
                    }}
                    style={[
                      styles.subModeBtn,
                      emailMode === 'login' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                    ]}>
                    <Text
                      style={[
                        styles.subModeText,
                        {
                          color: emailMode === 'login' ? colors.primary : colors.textSecondary,
                          fontWeight: emailMode === 'login' ? '700' : '500',
                        },
                      ]}>
                      Masuk Akun
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setEmailMode('register');
                      resetErrors();
                    }}
                    style={[
                      styles.subModeBtn,
                      emailMode === 'register' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                    ]}>
                    <Text
                      style={[
                        styles.subModeText,
                        {
                          color: emailMode === 'register' ? colors.primary : colors.textSecondary,
                          fontWeight: emailMode === 'register' ? '700' : '500',
                        },
                      ]}>
                      Daftar Baru
                    </Text>
                  </TouchableOpacity>
                </View>

                {emailMode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Lengkap</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={colors.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Contoh: Budi Santoso"
                        placeholderTextColor={colors.textLight}
                        value={emailName}
                        onChangeText={setEmailName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="nama@email.com"
                      placeholderTextColor={colors.textLight}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Kata Sandi</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor={colors.textLight}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Button
                  title={emailMode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}
                  onPress={emailMode === 'login' ? handleEmailLogin : handleEmailRegister}
                  size="lg"
                  loading={isSigningIn}
                  style={{ marginTop: Spacing.xs }}
                />
              </View>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerLabel, { color: colors.textSecondary }]}>ATAU</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Sign-in */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowGoogleModal(true)}
              activeOpacity={0.85}>
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={[styles.googleBtnText, { color: colors.text }]}>Lanjut dengan Google</Text>
            </TouchableOpacity>
          </View>

          {/* Collapsible Clean Demo / Testing Access */}
          <View style={styles.testingSection}>
            <TouchableOpacity
              style={styles.testingHeader}
              onPress={() => setShowDemoSection(!showDemoSection)}
              activeOpacity={0.7}>
              <Ionicons name="flask-outline" size={15} color={colors.textSecondary} />
              <Text style={[styles.testingHeaderText, { color: colors.textSecondary }]}>
                Akses Uji Coba Cepat (1-Klik)
              </Text>
              <Ionicons
                name={showDemoSection ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showDemoSection && (
              <View style={[styles.demoCard, { backgroundColor: isDark ? colors.surfaceVariant : '#F8FAFC', borderColor: colors.border }]}>
                <Text style={[styles.demoDesc, { color: colors.textSecondary }]}>
                  Pilih akun demo untuk langsung mencoba aplikasi tanpa registrasi manual:
                </Text>
                <View style={styles.demoButtonsRow}>
                  <TouchableOpacity
                    style={[styles.demoButton, { backgroundColor: colors.primaryBackground, borderColor: colors.primary }]}
                    onPress={() => loginAsDemo('customer')}
                    disabled={isSigningIn}>
                    <Ionicons name="person" size={16} color={colors.primary} />
                    <View>
                      <Text style={[styles.demoBtnTitle, { color: colors.primaryDark }]}>Pelanggan</Text>
                      <Text style={[styles.demoBtnSub, { color: colors.textSecondary }]}>Budi Santoso</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.demoButton, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}
                    onPress={() => loginAsDemo('admin')}
                    disabled={isSigningIn}>
                    <Ionicons name="shield-checkmark" size={16} color="#059669" />
                    <View>
                      <Text style={[styles.demoBtnTitle, { color: '#059669' }]}>Admin Barbershop</Text>
                      <Text style={[styles.demoBtnSub, { color: colors.textSecondary }]}>Mas Hendra</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <Text style={[styles.footerText, { color: colors.textLight }]}>
            AntriIn • Sistem Booking & Antrean Barbershop
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Test Modal */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="logo-google" size={24} color="#EA4335" />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Masuk Akun Google</Text>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Pilih akun Google simulasi untuk masuk di Expo Go:
            </Text>

            <TouchableOpacity
              style={[styles.googleAccountCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() =>
                handleGoogleCustomLogin('budi.santoso@gmail.com', 'Budi Santoso (Google)')
              }>
              <View style={[styles.googleAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.googleAvatarLetter}>B</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountName, { color: colors.text }]}>Budi Santoso (Pelanggan)</Text>
                <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>budi.santoso@gmail.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.googleAccountCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() =>
                handleGoogleCustomLogin('hendra.barber@gmail.com', 'Hendra Barbershop (Google)')
              }>
              <View style={[styles.googleAvatar, { backgroundColor: '#10B981' }]}>
                <Text style={styles.googleAvatarLetter}>H</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountName, { color: colors.text }]}>Hendra (Admin Barbershop)</Text>
                <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>hendra.barber@gmail.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowGoogleModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Batal</Text>
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
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  tabButtonText: {
    fontSize: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: 'normal',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    height: 48,
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 12,
  },
  otpHeaderWrap: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  otpIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  otpSub: {
    fontSize: 12,
    marginTop: 2,
  },
  changePhoneBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  changePhoneText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subModeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
  },
  subModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  subModeText: {
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.lg,
    height: 48,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testingSection: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  testingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  testingHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  demoCard: {
    width: '100%',
    marginTop: Spacing.sm,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  demoDesc: {
    fontSize: 11,
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  demoBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoBtnSub: {
    fontSize: 10,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  googleAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  googleAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleAvatarLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 11,
  },
  modalCancelBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
});