import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';
import { useTranslation } from 'react-i18next';
import { Haptics } from '../../utils/haptics';

interface ArticleContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
  isFavorite: boolean;
  isArchived: boolean;
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
  isArchived,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const screenHeight = Dimensions.get('window').height;
  const isInBottomHalf = position.y > screenHeight / 2;

  const menuPositionStyle = {
    top: isInBottomHalf ? undefined : position.y,
    bottom: isInBottomHalf ? screenHeight - position.y : undefined,
  };

  const handleRename = () => {
    Haptics.light();
    onRename();
  };

  const handleFavorite = () => {
    Haptics.light();
    onFavorite();
  };

  const handleArchive = () => {
    Haptics.light();
    onArchive();
  };

  const handleDelete = () => {
    Haptics.light();
    onDelete();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menu, menuPositionStyle]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleRename}>
            <View style={styles.menuItemContent}>
              <Icon
                name="pencil-outline"
                size={22}
                color={theme.colors.text}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>{t('common.rename')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleFavorite}>
            <View style={styles.menuItemContent}>
              <Icon
                name={isFavorite ? 'star' : 'star-outline'}
                size={22}
                color={isFavorite ? theme.colors.accent : theme.colors.text}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>
                {isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleArchive}>
            <View style={styles.menuItemContent}>
              <Icon
                name={isArchived ? 'archive-arrow-up-outline' : 'archive-outline'}
                size={22}
                color={theme.colors.text}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>
                {isArchived ? t('common.unarchive') : t('common.archive')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteItem]}
            onPress={handleDelete}
          >
            <View style={styles.menuItemContent}>
              <Icon
                name="trash-can-outline"
                size={22}
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
    },
    menu: {
      position: 'absolute',
      left: '5%',
      right: '5%',
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      paddingVertical: 10,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.5 : 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    menuItem: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      marginRight: 14,
    },
    deleteItem: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    menuText: {
      fontSize: 18,
      color: theme.colors.text,
    },
    deleteText: {
      color: '#FF3B30',
    },
  });
