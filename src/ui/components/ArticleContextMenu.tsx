import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';

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
            <Text style={styles.menuText}>✏️ Rename</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onArchive}>
            <Text style={styles.menuText}>📦 Archive</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteItem]}
            onPress={onDelete}
          >
            <Text style={[styles.menuText, styles.deleteText]}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  menuText: {
    fontSize: 16,
    color: '#111111',
  },
  deleteText: {
    color: '#FF3B30',
  },
});
