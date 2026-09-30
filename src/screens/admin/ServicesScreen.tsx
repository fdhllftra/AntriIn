import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getServices } from '../../services/firestore';
import { Service } from '../../types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Colors, Typography, Spacing, Layout, Radius } from '../../constants';
import { formatRupiah } from '../../utils/format';

export const ServicesScreen: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError('Gagal memuat daftar layanan.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Layanan</Text>
        <Text style={styles.screenSubtitle}>
          Kelola layanan via Firebase Console
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Coba Lagi" onPress={loadServices} size="sm" />
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadServices();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="cut-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>Belum ada layanan</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card>
              <View style={styles.topRow}>
                <View style={styles.nameBox}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.serviceDesc}>{item.description}</Text>
                </View>
                <Badge label={item.isActive ? 'Aktif' : 'Nonaktif'} type={item.isActive ? 'success' : 'neutral'} />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.price}>{formatRupiah(item.price)}</Text>
                <Text style={styles.duration}>{item.durationMinutes} menit</Text>
              </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  nameBox: {
    flex: 1,
  },
  serviceName: {
    ...Typography.h4,
    color: Colors.text,
  },
  serviceDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  price: {
    ...Typography.bodyMedium,
    color: Colors.primaryDark,
  },
  duration: {
    ...Typography.caption,
    color: Colors.textLight,
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