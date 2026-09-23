import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../services/api';
import { getCeo } from '../services/ceoService';
import { listServiceOrdersByCeo } from '../services/serviceOrderService';
import { displayValue, firstValue, formatDateTime } from '../utils/format';
import { getServiceOrderId } from '../utils/serviceOrder';
import StatusBadge from '../components/StatusBadge';
import { Button, ErrorBanner, GeoRow, InfoRow, LoadingView, PageHeader, Screen, SectionCard } from '../components/ui';
import { colors, fontSize, fontWeight, spacing } from '../theme';

const geoOf = (source) => firstValue(source, 'geoLocation', 'geolocation', 'coordinates');

export default function CeoDetailsScreen({ route, navigation }) {
  const { ceo: initialCeo, ceoId } = route?.params || {};
  const id = ceoId ?? initialCeo?.id;
  const { user } = useAuth();
  const canOpenServiceOrder = (user?.roles || []).some((role) => role === 'SUPER_ADMIN' || role === 'ADMIN');

  const [ceo, setCeo] = useState(initialCeo || null);
  const [loading, setLoading] = useState(!initialCeo);
  const [error, setError] = useState('');

  const [serviceOrders, setServiceOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [ordersAscending, setOrdersAscending] = useState(false);

  const load = useCallback(async () => {
    if (id == null) return;
    setLoading(true);
    setError('');

    try {
      setCeo(await getCeo(id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar os dados da CEO.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadServiceOrders = useCallback(async () => {
    if (id == null) return;
    setOrdersLoading(true);
    setOrdersError('');

    try {
      setServiceOrders(await listServiceOrdersByCeo(id));
    } catch (err) {
      setOrdersError(getApiErrorMessage(err, 'Não foi possível carregar as ordens de serviço desta CEO.'));
    } finally {
      setOrdersLoading(false);
    }
  }, [id]);

  // Recarrega ao voltar da tela de edição (ou de uma nova OS aberta),
  // garantindo que os dados exibidos reflitam a última alteração salva.
  useFocusEffect(
    useCallback(() => {
      load();
      loadServiceOrders();
    }, [load, loadServiceOrders])
  );

  const sortedServiceOrders = useMemo(() => {
    const valueOf = (order) => String(order?.createdAt || getServiceOrderId(order) || '');
    return [...serviceOrders].sort((a, b) =>
      ordersAscending ? valueOf(a).localeCompare(valueOf(b)) : valueOf(b).localeCompare(valueOf(a))
    );
  }, [serviceOrders, ordersAscending]);

  const address = ceo?.address || {};
  const coordinates = geoOf(address) || geoOf(ceo);

  if (loading) {
    return (
      <Screen>
        <LoadingView label="Carregando CEO..." />
      </Screen>
    );
  }

  if (error && !ceo) {
    return (
      <Screen>
        <View style={styles.centerState}>
          <ErrorBanner message={error} style={styles.centerError} />
          <Button label="Tentar novamente" onPress={load} style={styles.retryButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <PageHeader
        eyebrow="CAIXA DE EMENDAS ÓPTICAS"
        title={displayValue(ceo?.boxNumber)}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.headerActions}>
            <Button label="Editar" variant="outlinePrimary" onPress={() => navigation.navigate('CeoForm', { ceo })} style={styles.headerButton} />
            {canOpenServiceOrder ? (
              <Button label="Abrir OS" onPress={() => navigation.navigate('ServiceOrderCreate', { ceo })} />
            ) : null}
          </View>
        }
      />

      <SectionCard title="Informações da CEO">
        <InfoRow label="ID" value={ceo?.id} />
        <InfoRow label="BoxNumber" value={ceo?.boxNumber} />
        <InfoRow label="Descrição" value={ceo?.notes} />
        <InfoRow label="Status" value={ceo?.status} bordered={false} />
      </SectionCard>

      <SectionCard title="Endereço completo">
        <InfoRow label="Tipo" value={address.addressType} />
        <InfoRow label="Rua" value={address.street} />
        <InfoRow label="Número" value={address.streetNumber} />
        <InfoRow label="Bairro" value={address.neighborhood} />
        <InfoRow label="Cidade" value={address.city} />
        <InfoRow label="Ponto de referência" value={address.referencePoint} />
        <GeoRow coordinates={coordinates} bordered={false} />
      </SectionCard>

      <SectionCard
        title="Ordens de serviço"
        right={
          <Pressable onPress={() => setOrdersAscending((value) => !value)} hitSlop={8}>
            <Text style={styles.sortLink}>Ordenar: {ordersAscending ? 'antigas' : 'recentes'}</Text>
          </Pressable>
        }
      >
        {ordersLoading ? (
          <LoadingView label="Carregando ordens..." fill={false} />
        ) : sortedServiceOrders.length ? (
          sortedServiceOrders.map((order, index) => {
            const orderId = getServiceOrderId(order);
            return (
              <Pressable
                key={orderId ?? index}
                onPress={() => orderId != null && navigation.navigate('ServiceOrderDetail', { serviceOrderId: orderId })}
                style={[styles.orderRow, index === sortedServiceOrders.length - 1 && styles.orderRowLast]}
              >
                <View style={styles.orderRowHeader}>
                  <Text style={styles.orderId}>OS #{orderId ?? '—'}</Text>
                  <StatusBadge status={order?.status} />
                </View>
                <Text style={styles.orderDate}>{formatDateTime(order?.createdAt)}</Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.muted}>Nenhuma ordem de serviço registrada para esta CEO.</Text>
        )}

        <ErrorBanner message={ordersError} style={styles.errorSpacing} />
      </SectionCard>

      <ErrorBanner message={error} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { alignItems: 'stretch' },
  headerButton: { marginBottom: spacing.sm },
  centerState: { flex: 1, justifyContent: 'center', padding: spacing.xxl },
  centerError: { textAlign: 'center' },
  retryButton: { marginTop: spacing.md },
  sortLink: { color: colors.primary, fontWeight: fontWeight.extrabold, fontSize: fontSize.sm },
  orderRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingVertical: spacing.sm + 2,
  },
  orderRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  orderRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  orderId: { color: colors.textTitle, fontSize: fontSize.md, fontWeight: fontWeight.extrabold },
  orderDate: { color: colors.textMuted, fontSize: fontSize.base, marginTop: spacing.xs, textTransform: 'uppercase' },
  muted: { color: colors.textMuted, marginTop: spacing.sm },
  errorSpacing: { marginTop: spacing.sm },
});
