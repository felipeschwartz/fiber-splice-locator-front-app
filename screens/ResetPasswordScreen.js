import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { resetPassword } from '../services/authService';
import { Button, Card, ErrorBanner, Screen, TextField } from '../components/ui';
import { colors, fontSize, fontWeight, spacing } from '../theme';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen({ route, navigation }) {
  const initialEmail = route?.params?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Preencha o e-mail, o código e a nova senha.');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação precisam ser iguais.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await resetPassword({ email: email.trim(), token: token.trim(), newPassword });
      Alert.alert('Senha redefinida', 'Sua senha foi atualizada. Faça login com a nova senha.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Código inválido ou expirado. Solicite um novo.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen keyboardAvoiding scroll background={colors.backgroundSoft}>
      <View style={styles.container}>
        <Text style={styles.title}>Redefinir senha</Text>
        <Text style={styles.subtitle}>Cole o código recebido por e-mail e defina sua nova senha.</Text>

        <Card style={styles.form}>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            editable={!submitting}
          />

          <TextField
            label="Código recebido por e-mail"
            value={token}
            onChangeText={setToken}
            placeholder="Ex.: A2B7K9QX"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting}
          />

          <TextField
            label="Nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
            secureTextEntry
            autoCapitalize="none"
            editable={!submitting}
          />

          <TextField
            label="Confirmar nova senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repita a nova senha"
            secureTextEntry
            autoCapitalize="none"
            editable={!submitting}
            onSubmitEditing={handleSubmit}
          />

          <ErrorBanner message={error} style={styles.error} />

          <Button label="Redefinir senha" onPress={handleSubmit} loading={submitting} style={styles.submit} />
          <Button label="Voltar ao login" variant="outline" onPress={() => navigation.popToTop()} style={styles.backButton} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xxl + 4 },
  title: { textAlign: 'center', color: colors.textTitle, fontSize: fontSize.title, fontWeight: fontWeight.extrabold },
  subtitle: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl + 12,
  },
  form: { padding: spacing.xl },
  error: { marginBottom: spacing.md },
  submit: { marginTop: spacing.sm },
  backButton: { marginTop: spacing.md },
});
