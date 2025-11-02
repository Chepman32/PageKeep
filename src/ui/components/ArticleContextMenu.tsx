import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';
import { useTranslation } from 'react-i18next';

interface ArticleContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
  isFavorite: boolean;
}

export const ArticleContextMenu: React.FC<ArticleContextMenuProps> = ({
  visible,
  onClose,
  onRename,
  onFavorite,
  onArchive,
  onDelete,
  position,
  isFavorite,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={onRename}>
            <View style={styles.menuItemContent}>
              <Icon
                name="pencil-outline"
                size={18}
                color={theme.colors.text}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>{t('common.rename')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onFavorite}>
            <View style={styles.menuItemContent}>
              <Icon
                name={isFavorite ? 'star' : 'star-outline'}
                size={18}
                color={isFavorite ? theme.colors.accent : theme.colors.text}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>
                {isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onArchive}>
            <View style={styles.menuItemContent}>
              <Icon
                name="archive-outline"
                size={18}
                color={theme.colors.text}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>{t('common.archive')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteItem]}
            onPress={onDelete}
          >
            <View style={styles.menuItemContent}>
              <Icon
                name="trash-can-outline"
                size={18}
                color="#FF3B30"
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, styles.deleteText]}>
                {t('common.delete')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    menu: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      paddingVertical: 8,
      minWidth: 200,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.5 : 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    menuItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      marginRight: 12,
    },
    deleteItem: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    menuText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    deleteText: {
      color: '#FF3B30',
    },
  });
