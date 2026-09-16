import React, { useRef, useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';
import { getApiErrorMessage } from '../services/api';
import { uploadServiceOrderPhoto } from '../services/serviceOrderPhotoService';
import { Button } from './ui';

const DENIED_TEXT = {
  camera: {
    title: 'Acesso à câmera bloqueado',
    text: 'A câmera é necessária para anexar fotos à ordem. Permita o acesso nas configurações do sistema.',
  },
  gallery: {
    title: 'Acesso à galeria bloqueado',
    text: 'A galeria é necessária para selecionar fotos já existentes. Permita o acesso nas configurações do sistema.',
  },
};

// Fotos vindas da galeria podem estar em HEIC/HEIF (padrão em iPhones e em
// alguns Samsung com "formato de imagem eficiente"), formato que o backend
// não aceita e a maioria dos navegadores não renderiza. Reconvertemos tudo
// pra JPEG aqui, igual já acontece com a captura pela câmera do app.
async function toJpeg(asset, fallbackName) {
  const context = ImageManipulator.manipulate(asset.uri);
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  context.release();
  image.release();

  const baseName = (asset.fileName || fallbackName).replace(/\.[^.]+$/, '');
  return { uri: result.uri, mimeType: 'image/jpeg', fileName: `${baseName}.jpg` };
}

// Modos: idle -> camera | preview -> sending (ou "denied" se a permissão
// da câmera/galeria for negada, com `deniedFor` indicando qual das duas).
export default function CameraCapture({ serviceOrderId, onUploaded, deferUpload = false, onPhotoSelected }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('idle');
  const [deniedFor, setDeniedFor] = useState('camera');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  async function openCamera() {
    setError('');
    if (!permission) return;

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setDeniedFor('camera');
        setMode('denied');
        return;
      }
    }

    setMode('camera');
  }

  async function takePhoto() {
    if (!cameraRef.current) return;
    setError('');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, exif: false });
      if (!photo?.uri) throw new Error('A câmera não retornou uma imagem válida.');

      setPreview({ ...photo, mimeType: 'image/jpeg', fileName: `os-${serviceOrderId}-${Date.now()}.jpg` });
      setMode('preview');
    } catch (err) {
      setError(err.message || 'Não foi possível capturar a foto.');
    }
  }

  async function pickFromGallery() {
    setError('');

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setDeniedFor('gallery');
      setMode('denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      setError('Não foi possível selecionar a imagem.');
      return;
    }

    try {
      const jpeg = await toJpeg(asset, `os-${serviceOrderId}-${Date.now()}`);
      setPreview(jpeg);
      setMode('preview');
    } catch (err) {
      setError('Não foi possível processar a imagem selecionada.');
    }
  }

  async function sendPhoto() {
    if (!preview) return;

    if (deferUpload) {
      onPhotoSelected?.(preview);
      setPreview(null);
      setMode('idle');
      return;
    }

    setMode('sending');
    setError('');

    try {
      await uploadServiceOrderPhoto(serviceOrderId, preview);
      Alert.alert('Foto enviada', 'A foto foi anexada à ordem de serviço.');
      setPreview(null);
      setMode('idle');
      onUploaded?.();
    } catch (err) {
      setMode('preview');
      setError(getApiErrorMessage(err, 'Não foi possível enviar a foto.'));
    }
  }

  if (mode === 'denied') {
    const denied = DENIED_TEXT[deniedFor];
    return (
      <View style={styles.box}>
        <Text style={styles.title}>{denied.title}</Text>
        <Text style={styles.text}>{denied.text}</Text>
        <Button label="Abrir configurações" onPress={() => Linking.openSettings()} style={styles.spacedTop} />
        <Pressable onPress={() => setMode('idle')}>
          <Text style={styles.link}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'camera') {
    return (
      <View style={styles.cameraBox}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <Pressable style={styles.capture} onPress={takePhoto}>
          <Text style={styles.captureIcon}>●</Text>
        </Pressable>
        <Pressable onPress={() => setMode('idle')}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'preview' || mode === 'sending') {
    return (
      <View style={styles.box}>
        <Text style={styles.title}>Pré-visualização</Text>
        <Image source={{ uri: preview?.uri }} style={styles.preview} />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button
            variant="outline"
            label="Descartar"
            disabled={mode === 'sending'}
            onPress={() => {
              setPreview(null);
              setMode('idle');
            }}
            style={styles.actionButton}
          />
          <Button
            label={deferUpload ? 'Adicionar foto' : 'Confirmar envio'}
            loading={mode === 'sending'}
            onPress={sendPhoto}
            style={styles.actionButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <Button label="Tirar foto" onPress={openCamera} style={styles.actionButton} />
        <Button label="Escolher da galeria" variant="outline" onPress={pickFromGallery} style={styles.actionButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
  title: { color: colors.textTitle, fontSize: fontSize.lg, fontWeight: fontWeight.extrabold },
  text: { color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },
  spacedTop: { marginTop: spacing.md },
  link: { color: colors.primary, fontWeight: fontWeight.bold, textAlign: 'center', marginTop: spacing.md },
  cameraBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  camera: { width: '100%', height: 300, borderRadius: radius.md, overflow: 'hidden' },
  capture: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md + 2,
  },
  captureIcon: { color: colors.danger, fontSize: 42, lineHeight: 48 },
  cancel: { color: colors.onDarkLink, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
  preview: { width: '100%', height: 260, borderRadius: radius.md, marginTop: spacing.md, backgroundColor: colors.borderSoft },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1 },
  error: {
    color: colors.dangerText,
    backgroundColor: colors.dangerBg,
    padding: spacing.sm + 2,
    borderRadius: radius.sm,
    marginTop: spacing.sm + 2,
  },
});
