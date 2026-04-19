// Add this line at the very bottom of the file:
// export { MitingScreen };
// (or change `export default function MitingScreen` to `export function MitingScreen`)

import { View, Text, StyleSheet } from 'react-native';

// 1. The named export for React Navigation
export function MitingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Miting Screen Placeholder</Text>
    </View>
  );
}

// 2. The styles live at the bottom of the exact same file
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F6E56', // DLSL Green
  },
});