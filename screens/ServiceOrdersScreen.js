import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../services/api';
import { listServiceOrders } from '../services/serviceOrderService';
import { getServiceOrderId } from '../utils/serviceOrder';
import ServiceOrderCard from '../components/ServiceOrderCard';
import { SERVICE_ORDER_STATUS_META } from '../components/StatusBadge';
import { Chip, EmptyState, ErrorBanner, HeroHeader, LoadingView, Screen } from '../components/ui';
import { colors, fontSize, fontWeight, spacing } from '../theme';

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const filterLabel = (status) => (status === 'ALL' ? 'Todas' : SERVICE_ORDER_STATUS_META[status]?.label || status);

function sortOrders(orders, ascending) {
  const valueOf = (order) => String(order.updatedAt || order.createdAt || getServiceOrderId(order) || '');
  return [...orders].sort((a, b) => (ascending ? valueOf(a).localeCompare(valueOf(b)) : valueOf(b).localeCompare(valueOf(a))));
}

export default function ServiceOrdersScreen({ navigation }) {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('OPEN');
  const [ascending, setAscending] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setError('');
    refresh ? setRefreshing(true) : setLoading(true);

    try {
      setOrders(await listServiceOrders());
    } catch (err) {
      if (err.response?.status === 401) await logout();
      else setError(getApiErrorMessage(err, 'Não foi possível carregar as ordens.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleOrders = useMemo(() => {
    const filtered = orders.filter((order) => filter === 'ALL' || String(order.status || '').toUpperCase() === filter);
    return sortOrders(filtered, ascending);
  }, [orders, filter, ascending]);

  function openOrder(id) {
    if (id === null || id === undefined || id === '') {
      setError('Esta ordem não possui um identificador válido.');
      return;
    }
    navigation.navigate('ServiceOrderDetail', { serviceOrderId: id });
  }

  return (
    <Screen edges={['bottom']} statusBarStyle="light-content">
      <HeroHeader
        eyebrow="FIBER SPLICE LOCATOR"
        title="Ordens de serviço"
        right={
          <Pressable onPress={logout}>
            <Text style={styles.logout}>Sair</Text>
          </Pressable>
        }
      />

      <View style={styles.controls}>
        <View style={styles.filters}>
          {STATUS_FILTERS.map((status) => (
            <Chip key={status} label={filterLabel(status)} active={filter === status} onPress={() => setFilter(status)} />
          ))}
        </View>

        <Pressable onPress={() => setAscending((value) => !value)}>
          <Text style={styles.sort}>Ordenar: {ascending ? 'antigas' : 'recentes'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingView label="Carregando ordens..." />
      ) : (
        <FlatList
          data={visibleOrders}
          keyExtractor={(item, index) => String(getServiceOrderId(item) ?? index)}
          renderItem={({ item }) => <ServiceOrderCard order={item} onPress={openOrder} />}
          contentContainerStyle={visibleOrders.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
          ListHeaderComponent={error ? <ErrorBanner message={error} style={styles.errorBanner} /> : null}
          ListEmptyComponent={<EmptyState title="Nenhuma ordem encontrada" message="Ajuste o filtro ou atualize a lista." />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logout: { color: colors.onDarkLink, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  controls: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  sort: { color: colors.primary, fontWeight: fontWeight.extrabold, fontSize: fontSize.base, marginTop: spacing.sm + 2 },
  list: { padding: spacing.lg },
  emptyList: { flexGrow: 1, padding: spacing.lg },
  errorBanner: { marginBottom: spacing.md },
});
