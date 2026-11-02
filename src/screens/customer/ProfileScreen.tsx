import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Typography, Spacing, Layout, Radius } from '../../constants';

export const ProfileScreen: React.FC = () => {
  const { user, profile, signOut, isAdmin, updateProfilePhoto } = useAuth();
  const { themeMode, setThemeMode, isDark, colors } = useTheme();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickFromGallery = async () => {
    setShowPhotoModal(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Galeri Diperlukan',
          'Harap izinkan akses galeri untuk memilih foto profil.'
        );
        return;
      }

      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photoData = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await updateProfilePhoto(photoData);
        Alert.alert('Sukses', 'Foto profil berhasil diperbarui!');
      }
    } catch (err) {
      console.error('Gallery picker error:', err);
      Alert.alert('Gagal', 'Terjadi kesalahan saat memilih foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    setShowPhotoModal(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Kamera Diperlukan',
          'Harap izinkan akses kamera untuk mengambil foto profil.'
        );
        return;
      }

      setIsUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photoData = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await updateProfilePhoto(photoData);
        Alert.alert('Sukses', 'Foto profil berhasil diperbarui!');
      }
    } catch (err) {
      console.error('Camera capture error:', err);
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengambil foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToGuest = () => {
    setShowPhotoModal(false);
    Alert.alert(
      'Hapus Foto Profil',
      'Foto profil Anda akan dihapus dan kembali menggunakan profil tamu default. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              await updateProfilePhoto(null);
              Alert.alert('Berhasil', 'Foto profil dikembalikan ke tampilan profil tamu.');
            } catch (err) {
              Alert.alert('Gagal', 'Gagal mereset foto profil.');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Terang', icon: 'sunny' },
    { mode: 'dark', label: 'Gelap', icon: 'moon' },
    { mode: 'system', label: 'Sistem', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Profil</Text>
        </View>

        <Card style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setShowPhotoModal(true)}
            activeOpacity={0.8}
            disabled={isUploading}
            accessibilityLabel="Ubah foto profil">
            {isUploading ? (
              <View style={[styles.avatarPlaceholder, styles.avatarLoading, { backgroundColor: colors.primaryDark }]}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            ) : user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={[styles.avatar, { borderColor: colors.border }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={40} color={colors.white} />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primaryDark, borderColor: colors.surface }]}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{profile?.name || user?.displayName || 'Pengguna'}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Badge
                label={isAdmin ? 'Admin Barbershop' : 'Pelanggan'}
                type={isAdmin ? 'primary' : 'success'}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowPhotoModal(true)}
              style={styles.changePhotoBtn}
              activeOpacity={0.7}
              disabled={isUploading}>
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                {user?.photoURL ? 'Ganti Foto' : 'Pasang Foto Profil'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Pilihan Tema / Mode Gelap & Terang */}
        <Card style={styles.themeCard}>
          <View style={styles.themeCardHeader}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.surfaceVariant : colors.primaryLight }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.themeHeaderTextWrapper}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Tema Tampilan</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                {themeMode === 'system'
                  ? `Mengikuti Sistem (${isDark ? 'Gelap' : 'Terang'})`
                  : themeMode === 'dark'
                  ? 'Mode Gelap Aktif'
                  : 'Mode Terang Aktif'}
              </Text>
            </View>
          </View>

          <View style={styles.themeButtonsRow}>
            {themeOptions.map((item) => {
              const isSelected = themeMode === item.mode;
              return (
                <TouchableOpacity
                  key={item.mode}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? colors.surfaceVariant : '#EFF6FF')
                        : (isDark ? '#0F172A' : '#F8FAFC'),
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setThemeMode(item.mode)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      {
                        color: isSelected ? colors.primary : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.primary}
                      style={styles.checkBadge}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card>
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.surfaceVariant : colors.primaryLight }]}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
                {isAdmin ? 'Riwayat Transaksi' : 'Riwayat Booking'}
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                {isAdmin
                  ? 'Kelola dan pantau semua transaksi'
                  : 'Lihat booking yang pernah dibuat'}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.surfaceVariant : colors.primaryLight }]}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Bantuan</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                Pusat bantuan & kontak
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.versionRow}>
          <Image
            source={require('../../assets/images/app-logo.png')}
            style={styles.versionLogo}
            resizeMode="contain"
          />
          <Text style={[styles.versionText, { color: colors.textLight }]}>AntriIn v1.0.0</Text>
        </View>

        <Button
          title="Keluar dari Aplikasi"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </ScrollView>

      {/* Modal Options for Photo Profil */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoModal(false)}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Foto Profil</Text>
              <TouchableOpacity
                onPress={() => setShowPhotoModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: colors.border }]}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}>
              <View style={[styles.modalOptionIcon, { backgroundColor: isDark ? colors.surfaceVariant : colors.primaryLight }]}>
                <Ionicons name="images-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Pilih dari Galeri</Text>
                <Text style={[styles.modalOptionSub, { color: colors.textSecondary }]}>
                  Gunakan foto tersimpan di perangkat
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: colors.border }]}
              onPress={handleTakePhoto}
              activeOpacity={0.7}>
              <View style={[styles.modalOptionIcon, { backgroundColor: isDark ? colors.surfaceVariant : colors.primaryLight }]}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionText, { color: colors.text }]}>
                  Ambil Foto dengan Kamera
                </Text>
                <Text style={[styles.modalOptionSub, { color: colors.textSecondary }]}>
                  Ambil foto selfie langsung
                </Text>
              </View>
            </TouchableOpacity>

            {user?.photoURL ? (
              <TouchableOpacity
                style={[styles.modalOption, styles.modalOptionDanger, { borderBottomColor: colors.border }]}
                onPress={handleResetToGuest}
                activeOpacity={0.7}>
                <View style={[styles.modalOptionIcon, styles.modalOptionIconDanger, { backgroundColor: colors.errorLight }]}>
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                </View>
                <View style={styles.modalOptionTextWrapper}>
                  <Text style={[styles.modalOptionTextDanger, { color: colors.error }]}>
                    Hapus Foto Profil
                  </Text>
                  <Text style={[styles.modalOptionSubDanger, { color: colors.error }]}>
                    Kembali ke tampilan profil tamu
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.modalCancelButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowPhotoModal(false)}
              activeOpacity={0.8}>
              <Text style={[styles.modalCancelText, { color: colors.text }]}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPadding,
  },
  header: {
    marginBottom: Spacing.md,
  },
  screenTitle: {
    ...Typography.h2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoading: {},
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: 2,
  },
  changePhotoText: {
    ...Typography.captionMedium,
    marginLeft: 4,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.h4,
  },
  email: {
    ...Typography.caption,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: Spacing.sm,
  },
  // Theme card styles
  themeCard: {
    paddingVertical: Spacing.md,
  },
  themeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  themeHeaderTextWrapper: {
    flex: 1,
  },
  themeButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    position: 'relative',
    minHeight: 64,
  },
  themeOptionLabel: {
    ...Typography.caption,
    marginTop: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.bodyMedium,
  },
  menuSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  versionRow: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  versionLogo: {
    width: 36,
    height: 36,
    marginBottom: Spacing.xs,
    opacity: 0.85,
  },
  versionText: {
    ...Typography.caption,
  },
  signOutButton: {
    marginBottom: Spacing.xl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + (Platform.OS === 'ios' ? 20 : 10),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionDanger: {},
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modalOptionIconDanger: {},
  modalOptionTextWrapper: {
    flex: 1,
  },
  modalOptionText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  modalOptionSub: {
    ...Typography.caption,
    marginTop: 2,
  },
  modalOptionTextDanger: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  modalOptionSubDanger: {
    ...Typography.caption,
    marginTop: 2,
  },
  modalCancelButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
});