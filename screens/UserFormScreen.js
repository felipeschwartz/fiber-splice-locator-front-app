import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { createUser } from '../services/userService';
import { Button, Chip, PageHeader, Screen, TextField } from '../components/ui';
import { colors, fontSize, fontWeight, spacing } from '../theme';

const AVAILABLE_ROLES = ['FIELD_TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'];

export default function UserFormScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState(['FIELD_TECHNICIAN']);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function toggleRole(role) {
    setRoles((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
  }

  async function save() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, e-mail e senha.');
      return;
    }

    if (!roles.length) {
      Alert.alert('Perfil obrigatório', 'Selecione ao menos um perfil de acesso.');
      return;
    }

    setSaving(true);

    try {
      await createUser({ name: name.trim(), email: email.trim(), password, roles, active });
      Alert.alert('Usuário criado', 'O novo usuário já pode fazer login.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Não foi possível criar o usuário', getApiErrorMessage(error, 'Verifique os dados e tente novamente.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll padded>
      <PageHeader eyebrow="NOVO USUÁRIO" title="Cadastrar usuário" onBack={() => navigation.goBack()} />

      <TextField label="Nome" value={name} onChangeText={setName} placeholder="Nome completo" />
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="email@exemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Senha" value={password} onChangeText={setPassword} placeholder="Senha provisória" secureTextEntry />

      <Text style={styles.label}>Perfil de acesso</Text>
      <View style={styles.chipRow}>
        {AVAILABLE_ROLES.map((role) => (
          <Chip key={role} label={role} active={roles.includes(role)} onPress={() => toggleRole(role)} />
        ))}
      </View>

      <Text style={styles.label}>Situação</Text>
      <View style={styles.chipRow}>
        <Chip label="Ativo" active={active} onPress={() => setActive(true)} style={styles.flexChip} />
        <Chip label="Inativo" active={!active} onPress={() => setActive(false)} style={styles.flexChip} />
      </View>

      <View style={styles.actions}>
        <Button label="Cancelar" variant="outline" onPress={() => navigation.goBack()} disabled={saving} style={styles.flexButton} />
        <Button label="Confirmar" onPress={save} loading={saving} style={styles.flexButton} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flexChip: { flex: 1, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.xxl },
  flexButton: { flex: 1 },
});
