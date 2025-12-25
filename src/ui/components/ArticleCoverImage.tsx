import React, { useEffect, useMemo, useState } from 'react';
import {
  DeviceEventEmitter,
  Image,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { FileSystem } from '../../utils/fileSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';
import { ARTICLE_META_UPDATED_EVENT } from '../../services/SavePageService';

interface ArticleCoverImageProps {
  articleId: string;
  domain: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

interface ArticleMetaPayload {
  articleId: string;
  meta?: {
    coverImage?: string | null;
    [key: string]: unknown;
  };
}

export const ArticleCoverImage: React.FC<ArticleCoverImageProps> = ({
  articleId,
  domain,
  size = 70,
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      try {
        const meta = await FileSystem.readArticleMeta(articleId);
        if (!mounted) {
          return;
        }
        const nextCover = typeof meta?.coverImage === 'string' && meta.coverImage.length > 0
          ? meta.coverImage
          : null;
        setCoverImage(nextCover);
      } catch (error) {
        if (mounted) {
          setCoverImage(null);
        }
      }
    };

    loadMeta();

    const subscription = DeviceEventEmitter.addListener(
      ARTICLE_META_UPDATED_EVENT,
      (payload: ArticleMetaPayload) => {
        if (!payload || payload.articleId !== articleId) {
          return;
        }
        const nextCover =
          typeof payload.meta?.coverImage === 'string' && payload.meta.coverImage.length > 0
            ? payload.meta.coverImage
            : null;
        setCoverImage(current => {
          if (current === nextCover) {
            return current;
          }
          return nextCover;
        });
      },
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [articleId]);

  // Reset error state when coverImage changes
  useEffect(() => {
    setImageError(false);
  }, [coverImage]);

  const placeholderLetter = domain?.trim().charAt(0)?.toUpperCase() ?? '•';

  return (
    <View style={[styles.container, style]}>
      {coverImage && !imageError ? (
        <Image
          source={{ uri: coverImage }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            setImageError(true);
          }}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{placeholderLetter}</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme, size: number) =>
  StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 6,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
    },
    placeholderText: {
      fontSize: size / 2.4,
      fontWeight: '600',
      color: theme.colors.secondary,
    },
  });

export default ArticleCoverImage;
