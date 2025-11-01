import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';
import { useTranslation } from 'react-i18next';

interface ArticleContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
}

export const ArticleContextMenu: React.FC<ArticleContextMenuProps> = ({
  visible,
  onClose,
  onRename,
  onArchive,
  onDelete,
  position,
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
        <View
          style={[
            styles.menu,
            {
              top: position.y,
              left: position.x,
            },
          ]}
        >
          <TouchableOpacity style={styles.menuItem} onPress={onRename}>
            <Text style={styles.menuText}>✏️ {t('common.rename')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onArchive}>
            <Text style={styles.menuText}>📦 {t('common.archive')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteItem]}
            onPress={onDelete}
          >
            <Text style={[styles.menuText, styles.deleteText]}>
              🗑️ {t('common.delete')}
            </Text>
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
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      paddingVertical: 8,
      minWidth: 150,
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
