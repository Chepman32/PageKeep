import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSearchStore } from '../../store/searchStore';
import { SearchResult } from '../../domain/Article';

type SearchScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Search'
>;

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { query, results, history, setQuery, search, loadHistory } =
    useSearchStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      search();
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() =>
        navigation.navigate('Reader', { articleId: item.article.id })
      }
    >
      <Text style={styles.resultDomain}>{item.article.domain}</Text>
      <Text style={styles.resultTitle} numberOfLines={2}>
        {item.article.title}
      </Text>
      {item.highlights.length > 0 && (
        <Text style={styles.resultHighlight} numberOfLines={2}>
          {item.highlights[0].replace(/<\/?mark>/g, '')}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setQuery(item);
        search();
      }}
    >
      <Text style={styles.historyText}>🕐 {item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          autoFocus
          returnKeyType="search"
        />
      </View>

      {/* Results or History */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={item => item.article.id}
          contentContainerStyle={styles.list}
        />
      ) : query.trim() === '' && history.length > 0 ? (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Searches</Text>
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `${item}-${index}`}
          />
        </View>
      ) : query.trim() !== '' ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      ) : null}
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
    fontSize: 28,
    color: '#3A84F7',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    marginLeft: 8,
  },
  list: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultDomain: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  resultHighlight: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },
  historyContainer: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 12,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  historyText: {
    fontSize: 16,
    color: '#111111',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#616161',
  },
});

export default SearchScreen;
