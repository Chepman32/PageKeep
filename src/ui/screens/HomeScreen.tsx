import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useArticleStore } from '../../store/articleStore';
import { Article } from '../../domain/Article';
import { ArticleContextMenu } from '../components/ArticleContextMenu';
import { RenameModal } from '../components/RenameModal';
import { ArticleRepository } from '../../data/repositories/ArticleRepository';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { articles, loading, fetchArticles, updateArticle, deleteArticle } =
    useArticleStore();
  const [selectedTab, setSelectedTab] = useState<
    'all' | 'favorites' | 'archived'
  >('all');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    article: Article | null;
    position: { x: number; y: number };
  }>({
    visible: false,
    article: null,
    position: { x: 0, y: 0 },
  });
  const [renameModal, setRenameModal] = useState<{
    visible: boolean;
    article: Article | null;
  }>({
    visible: false,
    article: null,
  });

  const articleRepo = new ArticleRepository();

  useEffect(() => {
    loadArticles();
  }, [selectedTab]);

  const loadArticles = () => {
    const filters = {
      archived:
        selectedTab === 'archived'
          ? true
          : selectedTab === 'all'
          ? undefined
          : false,
      favorite: selectedTab === 'favorites' ? true : undefined,
    };
    fetchArticles(filters);
  };

  const handleLongPress = (article: Article, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;

    // Adjust position to keep menu on screen
    const menuWidth = 150;
    const adjustedX =
      pageX + menuWidth > screenWidth ? pageX - menuWidth : pageX;

    setContextMenu({
      visible: true,
      article,
      position: { x: adjustedX, y: pageY },
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      article: null,
      position: { x: 0, y: 0 },
    });
  };

  const handleRename = () => {
    if (contextMenu.article) {
      setRenameModal({
        visible: true,
        article: contextMenu.article,
      });
    }
    closeContextMenu();
  };

  const handleArchive = async () => {
    if (contextMenu.article) {
      try {
        await articleRepo.toggleArchive(contextMenu.article.id);
        updateArticle(contextMenu.article.id, {
          archived: !contextMenu.article.archived,
        });
        loadArticles();
      } catch (error) {
        Alert.alert('Error', 'Failed to archive article');
      }
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (contextMenu.article) {
      Alert.alert(
        'Delete Article',
        'Are you sure you want to delete this article? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteArticle(contextMenu.article!.id);
                loadArticles();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete article');
              }
            },
          },
        ],
      );
    }
    closeContextMenu();
  };

  const handleSaveRename = async (newTitle: string) => {
    if (renameModal.article) {
      try {
        await articleRepo.update(renameModal.article.id, { title: newTitle });
        updateArticle(renameModal.article.id, { title: newTitle });
        loadArticles();
      } catch (error) {
        Alert.alert('Error', 'Failed to rename article');
      }
    }
    setRenameModal({ visible: false, article: null });
  };

  const renderArticleCard = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Reader', { articleId: item.id })}
      onLongPress={event => handleLongPress(item, event)}
      delayLongPress={500}
    >
      <Text style={styles.domain}>{item.domain}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{item.readingTime} min read</Text>
        {item.favorite && <Text style={styles.metaText}>⭐</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No articles yet</Text>
      <Text style={styles.emptyText}>
        Tap the + button to save your first article
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PageNest</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.headerButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'all' && styles.tabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'favorites' && styles.tabActive]}
          onPress={() => setSelectedTab('favorites')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'favorites' && styles.tabTextActive,
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'archived' && styles.tabActive]}
          onPress={() => setSelectedTab('archived')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'archived' && styles.tabTextActive,
            ]}
          >
            Archived
          </Text>
        </TouchableOpacity>
      </View>

      {/* Article List */}
      <FlatList
        data={articles}
        renderItem={renderArticleCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadArticles}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Add')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Context Menu */}
      <ArticleContextMenu
        visible={contextMenu.visible}
        onClose={closeContextMenu}
        onRename={handleRename}
        onArchive={handleArchive}
        onDelete={handleDelete}
        position={contextMenu.position}
      />

      {/* Rename Modal */}
      <RenameModal
        visible={renameModal.visible}
        currentTitle={renameModal.article?.title || ''}
        onClose={() => setRenameModal({ visible: false, article: null })}
        onSave={handleSaveRename}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#3A84F7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
  },
  card: {
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
  domain: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#616161',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3A84F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});

export default HomeScreen;
