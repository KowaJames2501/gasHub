import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export const pickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];

    if (Platform.OS === 'web') {
      // Convert base64 URI to Blob
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      return {
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        uri: asset.uri,
        file: blob,
        isWeb: true,
      };
    } else {
      // Native returns proper file URI
      return {
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        uri: asset.uri,
        file: { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' },
        isWeb: false,
      };
    }
  } catch (error) {
    console.error('File picking failed:', error);
    return null;
  }
};
