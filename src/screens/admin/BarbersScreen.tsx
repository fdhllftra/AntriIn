import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBarbers } from '../../services/firestore';
import { Barber } from '../../types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';

export const BarbersScreen: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBarbers();
      setBarbers(data);
    } catch (err) {
      setError('Gagal memuat daftar kapster.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Kapster</Text>
        <Text style={styles.screenSubtitle}>
          Kelola kapster via Firebase Console
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Coba Lagi" onPress={loadBarbers} size="sm" />
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={barbers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadBarbers();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>Belum ada kapster</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.barberCard}>
              {item.photoURL ? (
                <Image source={{ uri: item.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color={Colors.white} />
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.specialty ? (
                  <Text style={styles.specialty}>{item.specialty}</Text>
                ) : null}
              </View>
              <Badge
                label={item.isActive ? 'Aktif' : 'Nonaktif'}
                type={item.isActive ? 'success' : 'neutral'}
              />
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  specialty: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  errorBox: {
    margin: Layout.screenPadding,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.text,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
});