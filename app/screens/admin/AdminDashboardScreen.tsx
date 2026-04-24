import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AdminDashboardScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.text}>Admin Dashboard</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0A0F0A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:   { color: '#F0FFF0', fontSize: 18, fontWeight: '600' },
});