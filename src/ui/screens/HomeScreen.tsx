import React, { useEffect, useMemo, useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useArticleStore } from '../../store/articleStore';
import { Article } from '../../domain/Article';
import { ArticleContextMenu } from '../components/ArticleContextMenu';
import { RenameModal } from '../components/RenameModal';
import { ArticleRepository } from '../../data/repositories/ArticleRepository';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
        Alert.alert(t('common.error'), t('home.alerts.archiveError'));
      }
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (contextMenu.article) {
      Alert.alert(t('home.alerts.deleteTitle'), t('home.alerts.deleteMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArticle(contextMenu.article!.id);
              loadArticles();
            } catch (error) {
              Alert.alert(t('common.error'), t('home.alerts.deleteError'));
            }
          },
        },
      ]);
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
        Alert.alert(t('common.error'), t('home.alerts.renameError'));
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
        <Text style={styles.metaText}>
       {t('home.readTime', { count: item.readingTime })}
      </Text>
      {item.favorite && (
        <Icon
          name="star"
          size={16}
          color={theme.colors.accent}
          style={styles.favoriteIcon}
        />
      )}
    </View>
  </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{t('home.emptyState')}</Text>
      <Text style={styles.emptyText}>{t('home.emptyHint')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('home.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Icon
              name="magnify"
              size={22}
              color={theme.colors.accent}
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon
              name="cog-outline"
              size={22}
              color={theme.colors.accent}
              style={styles.headerIcon}
            />
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
            {t('home.tabs.all')}
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
            {t('home.tabs.favorites')}
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
            {t('home.tabs.archived')}
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
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
    headerIcon: {
      color: theme.colors.accent,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
    },
    tabActive: {
      backgroundColor: theme.colors.accent,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    tabTextActive: {
      color: theme.colors.card,
    },
    list: {
      padding: 16,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: theme.isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.4 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    domain: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metaText: {
      fontSize: 12,
      color: theme.colors.muted,
    },
    favoriteIcon: {
      marginTop: 1,
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
      color: theme.colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.secondary,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.accent,
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
      color: theme.colors.card,
      fontWeight: '300',
    },
  });

export default HomeScreen;
