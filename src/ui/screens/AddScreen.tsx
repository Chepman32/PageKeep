import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SavePageService } from '../../services/SavePageService';
import { useArticleStore } from '../../store/articleStore';

const AddScreen: React.FC = () => {
  const navigation = useNavigation();
  const { fetchArticles } = useArticleStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const savePageService = new SavePageService();

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert(
        'Error',
        'Please enter a valid URL starting with http:// or https://',
      );
      return;
    }

    setLoading(true);

    try {
      // Start saving in background and get articleId immediately
      const articleId = await savePageService.saveFromUrlFast(url, {});

      // Show success immediately (background processing continues)
      setLoading(false);

      Alert.alert('Success', 'Article is being saved!', [
        {
          text: 'View',
          onPress: () => {
            navigation.goBack();
            // @ts-ignore
            navigation.navigate('Reader', { articleId });
          },
        },
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);

      setUrl('');

      // Refresh articles list in background
      fetchArticles().catch(err =>
        console.error('Error refreshing articles:', err)
      );
    } catch (error) {
      setLoading(false);
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Article</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>Enter URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/article"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Article</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tip: You can also use the Share Extension from Safari to save articles
          directly.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#616161',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#3A84F7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AddScreen;
