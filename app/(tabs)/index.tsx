import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY as string | undefined;

async function sendImageToClaude(base64Image: string, mediaType: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_ANTHROPIC_API_KEY');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'identify all the baked goods you can see and estimate the quantity of each item',
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const firstTextBlock =
    Array.isArray(data.content) && data.content.find((block: any) => block.type === 'text');

  if (firstTextBlock && typeof firstTextBlock.text === 'string') {
    return firstTextBlock.text;
  }

  return JSON.stringify(data, null, 2);
}

export default function DoughVisionScreen() {
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    try {
      setError(null);
      setResponseText(null);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0].base64) {
        return;
      }

      const asset = result.assets[0];

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );

      if (!manipulated.base64) {
        throw new Error('Failed to convert image to JPEG base64');
      }

      const base64Image = manipulated.base64;
      const mediaType = 'image/jpeg';

      setLoading(true);
      const text = await sendImageToClaude(base64Image, mediaType);
      setResponseText(text);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setError(null);
      setResponseText(null);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Photo library permission is needed to pick images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        base64: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0].base64) {
        return;
      }

      const asset = result.assets[0];

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );

      if (!manipulated.base64) {
        throw new Error('Failed to convert image to JPEG base64');
      }

      const base64Image = manipulated.base64;
      const mediaType = 'image/jpeg';

      setLoading(true);
      const text = await sendImageToClaude(base64Image, mediaType);
      setResponseText(text);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dough – Vision Spike</Text>
      <Text style={styles.subtitle}>
        Take a photo or pick one from your library. Claude will identify baked goods and estimate
        quantities.
      </Text>

      <View style={styles.buttonRow}>
        <View style={styles.button}>
          <Button title="Take Photo" onPress={handleTakePhoto} />
        </View>
        <View style={styles.button}>
          <Button title="Pick from Library" onPress={handlePickImage} />
        </View>
      </View>

      {loading && (
        <View style={styles.status}>
          <ActivityIndicator />
          <Text style={styles.statusText}>Analyzing image with Claude...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Error</Text>
          <ScrollView>
            <Text style={styles.errorText}>{error}</Text>
          </ScrollView>
        </View>
      )}

      {responseText && (
        <View style={styles.responseBox}>
          <Text style={styles.responseTitle}>Claude response</Text>
          <ScrollView>
            <Text style={styles.responseText}>{responseText}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
  errorBox: {
    maxHeight: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f00',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#ffe5e5',
  },
  errorTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#b00000',
  },
  errorText: {
    color: '#b00000',
  },
  responseBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  responseTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#222',
  },
});
