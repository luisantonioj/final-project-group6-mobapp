import { registerRootComponent } from 'expo';
import App from './App';

// Replaces expo-router's automatic entry detection.
// registerRootComponent ensures the app works correctly
// in both Expo Go and standalone builds.
registerRootComponent(App);