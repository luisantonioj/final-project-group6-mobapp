/**
 * useDepartments.ts
 * CRUD hook for the Departments table.
 * Used by AdminSettingsScreen (management panel) and by the
 * VoteScreen / ballot setup to map a student's department.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Database } from '../utils/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Department    = Database['public']['Tables']['Departments']['Row'];
export type DepartmentInsert = Database['public']['Tables']['Departments']['Insert'];
export type DepartmentUpdate = Database['public']['Tables']['Departments']['Update'];

const QK = ['departments'] as const;

// ─── GET (list) ───────────────────────────────────────────────────────────────

/** Returns ALL departments sorted by display_order, including inactive ones.
 *  Admin panels use this so soft-deleted departments remain visible. */
export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Departments')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 min — changes are rare but not impossible mid-session
  });
}

/** Returns only active departments — use this for student-facing selectors. */
export function useActiveDepartments() {
  return useQuery<Department[]>({
    queryKey: [...QK, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Departments')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DepartmentInsert) => {
      const { data, error } = await supabase
        .from('Departments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: DepartmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('Departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

// ─── SOFT-DELETE (toggle is_active) ──────────────────────────────────────────

/** Toggles a department's is_active flag. Use this instead of hard-delete
 *  to preserve referential integrity on existing position/candidate rows. */
export function useToggleDepartmentActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('Departments')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

// ─── REORDER ──────────────────────────────────────────────────────────────────

/** Batch-update display_order for a list of department ids.
 *  Pass the array in the desired final order; indices become the new order values. */
export function useReorderDepartments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('Departments').update({ display_order: index }).eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
