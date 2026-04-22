// app/notifications/notificationService.ts

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

const CHANNEL_ID = 'animoquorum';

/**
 * Request notification permissions and set up the Android channel.
 * Returns true if permission was granted, false otherwise.
 *
 * Called once on app mount (App.tsx) AND internally before each
 * displayNow() call — matching the reference project pattern where
 * registerForNotificationsAsync() is self-contained and safe to call
 * multiple times (channel creation is idempotent on Android).
 */
export const registerForNotificationsAsync = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id:               CHANNEL_ID,
      name:             'AnimoQuorum',
      importance:       AndroidImportance.HIGH,
      vibration:        true,
      vibrationPattern: [0, 250, 250, 250],
      lights:           true,
      lightColor:       '#22C55E',
      visibility:       AndroidVisibility.PUBLIC,
    });
  }

  const settings = await notifee.requestPermission();

  const granted =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (!granted) {
    console.warn('[Notifications] Permission not granted.');
    return false;
  }

  return true;
};

// ─── Internal helper ──────────────────────────────────────────────────────────

async function displayNow(title: string, body: string): Promise<void> {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId:   CHANNEL_ID,
      importance:  AndroidImportance.HIGH,
      pressAction: { id: 'default' }, // brings app to foreground on tap
      smallIcon:   'ic_launcher',     // must exist in android/app/src/main/res
    },
    ios: {
      sound: 'default',
      foregroundPresentationOptions: {
        alert: true,
        sound: true,
        badge: false,
      },
    },
  });
}

// ─── Exported notification triggers ──────────────────────────────────────────

/**
 * Call when SystemSettings.voting_start_time is reached or admin sets
 * votingOpen = true. Wire to a Supabase Realtime listener.
 */
export const notifyVotingStarted = async (): Promise<void> => {
  const hasPermission = await registerForNotificationsAsync();
  if (!hasPermission) return;
  await displayNow(
    '🗳️  Voting is now open!',
    'Cast your vote in AnimoQuorum before time runs out.',
  );
};

/**
 * Call immediately after useCastVote() succeeds in VoteScreen.
 */
export const notifyVoteSubmitted = async (): Promise<void> => {
  const hasPermission = await registerForNotificationsAsync();
  if (!hasPermission) return;
  await displayNow(
    '✅  Vote submitted!',
    'Your choices have been recorded. Thank you for participating.',
  );
};

/**
 * Call when SystemSettings.voting_end_time is reached or votingOpen = false.
 * Wire to a Supabase Realtime listener on the SystemSettings table.
 */
export const notifyVotingEnded = async (): Promise<void> => {
  const hasPermission = await registerForNotificationsAsync();
  if (!hasPermission) return;
  await displayNow(
    '🔒  Voting has closed',
    'Thank you for voting! Results will be announced shortly.',
  );
};

/**
 * Admin-triggered alert — Miting going live, important announcements.
 * Call from a Supabase Realtime listener on Posts or SystemSettings.
 *
 * @param message - The body text shown in the notification
 */
export const notifyAdminAlert = async (message: string): Promise<void> => {
  const hasPermission = await registerForNotificationsAsync();
  if (!hasPermission) return;
  await displayNow('📢  AnimoQuorum', message);
};

// ─── Foreground event handler (call in App.tsx useEffect) ────────────────────

/**
 * Handles notification interactions while the app is in the foreground.
 * Equivalent to Notifications.addNotificationResponseReceivedListener()
 * in the reference project — returns an unsubscribe function for cleanup.
 *
 * Extend the switch block to navigate on tap, e.g. deep-link to VoteScreen.
 */
export const addNotificationResponseReceivedListener = (): (() => void) => {
  return notifee.onForegroundEvent(({ type, detail }) => {
    switch (type) {
      case EventType.PRESS:
        console.log('[App] Notification tapped:', detail.notification?.id);
        // TODO: navigate based on detail.notification?.data?.type
        break;
      case EventType.DISMISSED:
        console.log('[App] Notification dismissed:', detail.notification?.id);
        break;
    }
  });
};

// ─── Realtime wiring suggestion ───────────────────────────────────────────────
/**
 * Wire SystemSettings Realtime to auto-trigger notifications in App.tsx:
 *
 *   useEffect(() => {
 *     const channel = supabase
 *       .channel('settings-watch')
 *       .on('postgres_changes',
 *           { event: 'UPDATE', schema: 'public', table: 'SystemSettings' },
 *           (payload) => {
 *             const old = payload.old as any;
 *             const next = payload.new as any;
 *             if (!old.voting_start_time && next.voting_start_time) notifyVotingStarted();
 *             if (old.voting_end_time !== next.voting_end_time)      notifyVotingEnded();
 *           })
 *       .subscribe();
 *     return () => { supabase.removeChannel(channel); };
 *   }, []);
 */