import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ReaderScreen from '../screens/ReaderScreen';
import AddScreen from '../screens/AddScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../../contexts/ThemeContext';

export type RootStackParamList = {
  Home: undefined;
  Reader: { articleId: string };
  Add: undefined;
  Search: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: theme.isDark,
      colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.accent,
      },
    }),
    [theme],
  );

  const screenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: theme.colors.text,
      },
      headerTintColor: theme.colors.accent,
      headerBackTitleVisible: false,
      headerTitleAlign: 'center' as const,
    }),
    [theme],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={screenOptions}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{ title: '' }}
        />
        <Stack.Screen
          name="Add"
          component={AddScreen}
          options={{
            title: '',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
