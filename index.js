/**
 * @format
 */

import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import App from './App';
import { name as appName } from './app.json';

MaterialCommunityIcons.loadFont().catch(error => {
  console.warn('Failed to load MaterialCommunityIcons font:', error);
});

AppRegistry.registerComponent(appName, () => App);
