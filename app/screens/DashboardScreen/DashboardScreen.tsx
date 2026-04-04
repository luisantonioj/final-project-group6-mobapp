import { View, Text } from 'react-native';
import { styles } from './DashboardScreen.styles';
import { PrimaryButton } from '../../components/PrimaryButton';

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome, Voter!</Text>
      <Text style={styles.subHeader}>DLSL COMELEC Elections 2026</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Official Candidates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Days Until Voting</Text>
        </View>
      </View>

      {/* Demonstrating the new Pressable component to the team */}
      <PrimaryButton 
        title="View Ballot Options" 
        onPress={() => console.log('Navigate to Ballot')} 
      />
    </View>
  );
}