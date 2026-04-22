/**
 * utils/notifications.ts — Local push notification helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps expo-notifications for the three notification types AnimoQuorum uses:
 *
 *   1. VOTING START   — "Voting is now open! Go cast your vote."
 *   2. VOTE SUBMITTED — "Your vote has been submitted successfully."
 *   3. VOTING END     — "Voting has closed. Results will be announced soon."
 *   4. ADMIN ALERT    — Custom message pushed from admin actions (Miting, etc.)
 *
 * SETUP (call once on app launch, before any notification is scheduled):
 * ─────────────────────────────────────────────────────────────────────────────
 *   import { setupNotifications } from '../utils/notifications';
 *   await setupNotifications(); // in App.tsx useEffect or a root component
 *
 * USAGE IN SCREENS:
 * ─────────────────────────────────────────────────────────────────────────────
 *   import { notifyVotingStarted, notifyVoteSubmitted, notifyVotingEnded, notifyAdminAlert }
 *     from '../utils/notifications';
 *
 *   // In VoteScreen, after successful vote submission:
 *   await notifyVoteSubmitted();
 *
 *   // From a Supabase Realtime listener when SystemSettings.votingOpen changes:
 *   await notifyVotingStarted();
 *   await notifyVotingEnded();
 *
 *   // For admin-triggered alerts (e.g. Miting going live):
 *   await notifyAdminAlert('Miting de Avance is now live! Join the Q&A.');
 *
 * IMPORTANT — PERMISSIONS:
 * ─────────────────────────────────────────────────────────────────────────────
 *   setupNotifications() requests permission. If the user denies it, all
 *   schedule calls silently do nothing. Always check the returned status
 *   before relying on notifications.
 *
 * NOTE ON REMOTE PUSH (future):
 * ─────────────────────────────────────────────────────────────────────────────
 *   This file handles LOCAL notifications only (scheduled on-device).
 *   For true remote push (admin triggers a notification for ALL students),
 *   you'd need an Expo Push Token + a server-side send. The structure here
 *   is intentionally easy to upgrade:
 *     1. Call getExpoPushToken() in setupNotifications() and store the token
 *        in the Users table (add a push_token column).
 *     2. Admin screen sends to all tokens via Expo's Push API.
 *   The on-device notification handlers below remain unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Configure how notifications appear when the app is foregrounded ──────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

// ─── Request permission + set Android channel ─────────────────────────────────
export async function setupNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted.');
    return false;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('animoquorum', {
      name:       'AnimoQuorum',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22C55E',
    });
  }

  return true;
}

// ─── Helper: schedule an immediate local notification ─────────────────────────
async function scheduleNow(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound:  true,
      data:   { sentAt: new Date().toISOString() },
    },
    trigger: null, // null = deliver immediately
  });
}

// ─── Exported notification triggers ──────────────────────────────────────────

/**
 * Call this when SystemSettings.voting_start_time is reached or when
 * the admin sets votingOpen = true. Wire to a Supabase Realtime listener.
 */
export const notifyVotingStarted = () =>
  scheduleNow(
    '🗳️  Voting is now open!',
    'Cast your vote in AnimoQuorum before time runs out.',
  );

/**
 * Call this immediately after useCastVote() succeeds in VoteScreen.
 */
export const notifyVoteSubmitted = () =>
  scheduleNow(
    '✅  Vote submitted!',
    'Your choices have been recorded. Thank you for participating.',
  );

/**
 * Call this when SystemSettings.voting_end_time is reached or votingOpen = false.
 * Wire to a Supabase Realtime listener on the SystemSettings table.
 */
export const notifyVotingEnded = () =>
  scheduleNow(
    '🔒  Voting has closed',
    'Thank you for voting! Results will be announced shortly.',
  );

/**
 * Used for admin-triggered alerts — Miting going live, important announcements.
 * Admins can trigger this by updating a field in SystemSettings or sending
 * a special post type that the app's Realtime listener picks up.
 *
 * @param message - The body text shown in the notification
 */
export const notifyAdminAlert = (message: string) =>
  scheduleNow('📢  AnimoQuorum', message);

// ─── Realtime listener hook (use in App.tsx or a root provider) ───────────────
/**
 * SUGGESTION — Wire SystemSettings Realtime to auto-trigger notifications:
 *
 *   import { supabase } from './supabase';
 *   import { notifyVotingStarted, notifyVotingEnded } from './notifications';
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
