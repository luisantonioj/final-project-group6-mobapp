/**
 * admin/UserManagementScreen.tsx — Manage student voter accounts
 * ─────────────────────────────────────────────────────────────────────────────
 * TASK: Display all registered student accounts. Admin can toggle a student's
 * is_active status to deactivate invalid or duplicate registrations.
 *
 * DATA TO FETCH:
 * ─────────────────────────────────────────────────────────────────────────────
 *   const { data: users, isLoading } = useUsers(); // app/hooks/useUsers.ts
 *   → GET /users → Reads → Users (all rows), admin only
 *   → Returns all student accounts
 *
 * TOGGLING ACTIVE STATUS (PATCH /users/:id/status):
 * ─────────────────────────────────────────────────────────────────────────────
 *   await supabase.from('Users').update({ is_active: !user.is_active }).eq('id', user.id);
 *   → This action is automatically logged to AuditLogs server-side
 *   → Invalidate ['users'] query after update
 *
 *   Show a confirmation Alert before deactivating a user:
 *   "Deactivate [name]? They will no longer be able to vote."
 *
 * UI LAYOUT:
 * ─────────────────────────────────────────────────────────────────────────────
 *   [ "User Management" heading + total count badge ]
 *   [ Search bar to filter by name or email         ]
 *   [ FlatList of user rows:                        ]
 *     → Avatar (initials), name, email
 *     → is_active toggle Switch (green = active, gray = inactive)
 *     → Inactive users shown with dimmed style
 *   [ Empty state: "No registered students."        ]
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { View, Text } from 'react-native';

// TODO: Replace this placeholder with the full implementation described above.
export function UserManagementScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F0A' }}>
      <Text style={{ color: '#F0FFF0' }}>User Management — TODO</Text>
    </View>
  );
}
