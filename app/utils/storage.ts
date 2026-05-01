/**
 * storage.ts — Supabase Storage helpers
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralises uploads to Supabase Storage so we never persist a local
 * `file://` URI into a database row. Local URIs only exist on the
 * device that picked the file — every other client sees a broken image.
 *
 * BUCKET SETUP (one-time, in your Supabase project):
 *   1. Storage → New bucket → name: "candidate-photos" → Public: ON
 *   2. Suggested RLS policies on storage.objects:
 *      - SELECT: allow public read on bucket "candidate-photos"
 *      - INSERT/UPDATE/DELETE: restrict to admins
 *      Example admin-only write policy (adjust to match your auth model):
 *
 *        create policy "Admins manage candidate photos"
 *        on storage.objects for all
 *        using (
 *          bucket_id = 'candidate-photos'
 *          and exists (
 *            select 1
 *              from public."UserRoles" ur
 *              join public."Roles" r on r.id = ur.role_id
 *              join public."Users"  u on u.id = ur.user_id
 *             where u.auth_id = auth.uid()
 *               and r.role_name = 'Admin'
 *          )
 *        )
 *        with check (bucket_id = 'candidate-photos');
 *
 * USAGE:
 *   const url = await uploadCandidatePhoto(localUri, candidate.name);
 *   await supabase.from('Candidates').update({ photo_url: url }).eq('id', id);
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { supabase } from './supabase';

export const CANDIDATE_PHOTOS_BUCKET = 'candidate-photos';

/**
 * Returns true if the URI is a local on-device path that has NOT yet been
 * uploaded to remote storage. expo-image-picker returns these on iOS/Android.
 */
export function isLocalFileUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return (
    uri.startsWith('file://')    ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://')      ||
    uri.startsWith('assets-library://')
  );
}

/** Slugify a candidate name for use inside an object key. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'candidate';
}

/**
 * Uploads a local image URI to the candidate-photos bucket and returns
 * the public URL suitable for storing in `Candidates.photo_url`.
 *
 * Throws on failure — callers should wrap in try/catch and surface to user.
 */
export async function uploadCandidatePhoto(
  localUri: string,
  candidateName: string,
): Promise<string> {
  // ── 1. Determine extension + content type ─────────────────────────────────
  const rawExt = (localUri.split('?')[0].split('.').pop() ?? '').toLowerCase();
  const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
  const ext = allowed.has(rawExt) ? rawExt : 'jpg';
  const contentType =
    ext === 'jpg'           ? 'image/jpeg' :
    ext === 'heic' || ext === 'heif' ? 'image/heic' :
                                       `image/${ext}`;

  // ── 2. Read the local file as ArrayBuffer ────────────────────────────────
  // Using fetch().arrayBuffer() works on Expo SDK 54 / RN 0.81 with Hermes.
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error(`Could not read picked image (status ${response.status}).`);
  }
  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('Picked image is empty or unreadable.');
  }

  // ── 3. Upload to Supabase Storage ─────────────────────────────────────────
  const filename = `${slugify(candidateName)}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(CANDIDATE_PHOTOS_BUCKET)
    .upload(filename, arrayBuffer, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  // ── 4. Resolve the public URL ─────────────────────────────────────────────
  const { data } = supabase.storage
    .from(CANDIDATE_PHOTOS_BUCKET)
    .getPublicUrl(filename);

  if (!data?.publicUrl) {
    throw new Error('Photo uploaded but public URL could not be resolved.');
  }
  return data.publicUrl;
}
