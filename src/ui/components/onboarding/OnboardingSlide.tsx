import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Theme } from '../../../constants/themes';

interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: React.ReactNode;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  title,
  description,
  illustration,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>{illustration}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    illustrationContainer: {
      width: 300,
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 48,
    },
    textContainer: {
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: 0.3,
    },
    description: {
      fontSize: 16,
      color: theme.colors.secondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 340,
    },
  });
