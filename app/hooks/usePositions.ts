/**
 * usePositions.ts
 * Replaces the hardcoded EXECUTIVE_POSITIONS / DEPARTMENT_POSITIONS / POSITION_IDS
 * constants in candidateStore.ts with live Supabase queries.
 *
 * Key behaviours:
 *  - usePositions()              → all active positions (admin ballot builder)
 *  - usePositions(deptId)        → exec + dept positions for one department (ballot screen)
 *  - useExecutivePositions()     → executive positions only
 *  - useDepartmentPositions(id)  → positions for one dept
 *  - useCreatePosition()         → admin CRUD
 *  - useUpdatePosition()         → admin CRUD
 *  - useTogglePositionActive()   → soft-delete
 *  - useReorderPositions()       → drag-to-reorder
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Database } from '../utils/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Position       = Database['public']['Tables']['Positions']['Row'];
export type PositionInsert = Database['public']['Tables']['Positions']['Insert'];
export type PositionUpdate = Database['public']['Tables']['Positions']['Update'];

const QK = (suffix?: string) =>
  suffix ? (['positions', suffix] as const) : (['positions'] as const);

// ─── GET — all active positions ───────────────────────────────────────────────

/** All active positions with their department names joined.
 *  Used by admin ballot builder.
 *  staleTime is short because admins can add/rename positions at runtime. */
export function usePositions() {
  return useQuery({
    queryKey: QK(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Positions')
        .select('*, Departments:department_id(id, name)')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── GET — executive only ─────────────────────────────────────────────────────

export function useExecutivePositions() {
  return useQuery<Position[]>({
    queryKey: QK('executive'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Positions')
        .select('*')
        .eq('is_executive', true)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── GET — by department ──────────────────────────────────────────────────────

export function useDepartmentPositions(departmentId: string | null | undefined) {
  return useQuery<Position[]>({
    queryKey: QK(departmentId ?? 'none'),
    queryFn: async () => {
      if (!departmentId) return [];
      const { data, error } = await supabase
        .from('Positions')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PositionInsert) => {
      const { data, error } = await supabase
        .from('Positions')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK() }),
  });
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: PositionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('Positions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK() }),
  });
}

// ─── SOFT-DELETE ──────────────────────────────────────────────────────────────

/** Soft-deletes a position. A position with existing votes cannot be hard-deleted
 *  because the Votes table holds a FK to position_id. Use this instead. */
export function useTogglePositionActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('Positions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK() }),
  });
}

// ─── REORDER ──────────────────────────────────────────────────────────────────

export function useReorderPositions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('Positions').update({ display_order: index }).eq('id', id)
      );
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK() }),
  });
}
