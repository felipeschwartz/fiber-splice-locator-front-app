import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../services/api';
import { searchUsers } from '../services/userService';
import { Button, Card, ErrorBanner, HeroHeader, InfoRow, LoadingView, Screen, SectionCard } from '../components/ui';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export default function UsersScreen({ navigation }) {
  const { user } = useAuth();
  const canCreateUsers = ADMIN_ROLES.some((role) => user?.roles?.includes(role));

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await searchUsers(query.trim());
      setResults(Array.isArray(result) ? result : []);
      setSearched(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível buscar usuários.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll edges={['bottom']} statusBarStyle="light-content">
      <HeroHeader
        eyebrow="MINHA CONTA"
        title="Usuários"
        right={
          canCreateUsers ? (
            <Pressable onPress={() => navigation.navigate('UserForm')} hitSlop={8}>
              <Ionicons name="person-add-outline" size={22} color={colors.onDarkTitle} />
            </Pressable>
          ) : null
        }
      />

      <View style={styles.content}>
        <SectionCard title="Meus dados">
          <InfoRow label="ID" value={user?.id} />
          <InfoRow label="Nome" value={user?.name} />
          <InfoRow label="E-mail" value={user?.email} />
          <InfoRow label="Perfil" value={user?.roles?.join(', ')} bordered={false} />
          <Button
            label="Alterar senha"
            variant="outlinePrimary"
            onPress={() => navigation.navigate('ChangePassword')}
            style={styles.changePasswordButton}
          />
        </SectionCard>

        <SectionCard title="Buscar usuário">
          <View style={styles.search}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder="Buscar por ID ou nome"
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <Pressable onPress={search} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Buscar</Text>
            </Pressable>
          </View>

          <ErrorBanner message={error} style={styles.errorSpacing} />

          {loading ? <LoadingView fill={false} /> : null}

          {!loading && searched && !results.length && !error ? (
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
          ) : null}

          {results.map((item) => (
            <Card key={item.id} style={styles.resultCard}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultMeta}>ID: {item.id}</Text>
              <Text style={styles.resultMeta}>{item.email}</Text>
            </Card>
          ))}
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  changePasswordButton: { marginTop: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center' },
  searchInput: {
    flex: 1,
    height: 46,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.textTitle,
    marginRight: spacing.sm,
  },
  searchButton: {
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: { color: colors.white, fontWeight: fontWeight.extrabold },
  errorSpacing: { marginTop: spacing.md },
  emptyText: { color: colors.textMuted, marginTop: spacing.md },
  resultCard: { marginTop: spacing.md, padding: spacing.md },
  resultName: { color: colors.textTitle, fontSize: fontSize.md, fontWeight: fontWeight.extrabold },
  resultMeta: { color: colors.textMuted, marginTop: spacing.xs, fontSize: fontSize.base },
});
