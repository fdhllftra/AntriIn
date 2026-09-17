import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';

export const ProfileScreen: React.FC = () => {
  const { user, profile, signOut, isAdmin } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profil</Text>
        </View>

        <Card style={styles.profileCard}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={Colors.white} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.name || user?.displayName || 'Pengguna'}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Badge
                label={isAdmin ? 'Admin Barbershop' : 'Pelanggan'}
                type={isAdmin ? 'primary' : 'success'}
              />
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{isAdmin ? 'Riwayat Transaksi' : 'Riwayat Booking'}</Text>
              <Text style={styles.menuSubtitle}>
                {isAdmin
                  ? 'Kelola dan pantau semua transaksi'
                  : 'Lihat booking yang pernah dibuat'}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Bantuan</Text>
              <Text style={styles.menuSubtitle}>Pusat bantuan & kontak</Text>
            </View>
          </View>
        </Card>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>AntriIn v1.0.0</Text>
        </View>

        <Button
          title="Keluar dari Aplikasi"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Layout.screenPadding,
  },
  header: {
    marginBottom: Spacing.md,
  },
  screenTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.h4,
    color: Colors.text,
  },
  email: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  menuSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  versionRow: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  signOutButton: {
    marginBottom: Spacing.xl,
  },
});