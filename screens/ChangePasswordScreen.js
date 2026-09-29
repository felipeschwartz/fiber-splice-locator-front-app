import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { changeOwnPassword } from '../services/userService';
import { Button, PageHeader, Screen, TextField } from '../components/ui';
import { spacing } from '../theme';

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha a senha atual, a nova senha e a confirmação.');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Senha muito curta', `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas não conferem', 'A nova senha e a confirmação precisam ser iguais.');
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Senha igual à atual', 'Escolha uma nova senha diferente da atual.');
      return;
    }

    setSaving(true);

    try {
      await changeOwnPassword({ currentPassword, newPassword });
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Não foi possível alterar a senha', getApiErrorMessage(error, 'Verifique a senha atual e tente novamente.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll padded>
      <PageHeader eyebrow="MINHA CONTA" title="Alterar senha" onBack={() => navigation.goBack()} />

      <TextField
        label="Senha atual"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Informe sua senha atual"
        secureTextEntry
        autoCapitalize="none"
      />

      <TextField
        label="Nova senha"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
        secureTextEntry
        autoCapitalize="none"
      />

      <TextField
        label="Confirmar nova senha"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Repita a nova senha"
        secureTextEntry
        autoCapitalize="none"
      />

      <Button label="Salvar nova senha" onPress={save} loading={saving} style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  saveButton: { marginTop: spacing.xxl },
});
