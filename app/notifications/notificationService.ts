// app/notifications/notificationService.ts
import Toast from 'react-native-toast-message';

// ─── Internal helper ──────────────────────────────────────────────────────────
function displayNow(title: string, body: string) {
  Toast.show({
    type: 'success', // You can style this custom later if you want
    text1: title,
    text2: body,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
  });
}

// ─── Exported notification triggers ──────────────────────────────────────────

export const notifyVotingStarted = async (): Promise<void> => {
  displayNow('🗳️  Voting is now open!', 'Cast your vote in AnimoQuorum before time runs out.');
};

export const notifyVoteSubmitted = async (): Promise<void> => {
  displayNow('✅  Vote submitted!', 'Your choices have been recorded. Thank you for participating.');
};

export const notifyVotingEnded = async (): Promise<void> => {
  displayNow('🔒  Voting has closed', 'Thank you for voting! Results will be announced shortly.');
};

export const notifyAdminAlert = async (message: string): Promise<void> => {
  Toast.show({
    type: 'info',
    text1: '📢  AnimoQuorum',
    text2: message,
    position: 'top',
    visibilityTime: 5000,
  });
};

/**
 * Dummy permission function for Expo Go compatibility.
 * Toasts don't require OS permissions, so we just return true.
 */
export const registerForNotificationsAsync = async (): Promise<boolean> => {
  return true;
};

/**
 * Dummy listener function for Expo Go compatibility.
 * Returns an empty cleanup function so App.tsx doesn't crash on unmount.
 */
export const addNotificationResponseReceivedListener = (): (() => void) => {
  return () => {}; 
};