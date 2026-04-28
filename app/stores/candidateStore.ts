/**
 * stores/candidateStore.ts
 *
 * Single source of truth for candidate data in frontend-only (dummy) mode.
 * Both AdminCandidatesScreen and VoteScreen read from and write to this store,
 * ensuring full sync between the two screens.
 *
 * When connecting the backend:
 *   - Replace useCandidateStore() reads with useQuery hooks (useCandidates, useCandidate)
 *   - Replace write actions with useMutation hooks (useCreateCandidate, useUpdateCandidate, useDeleteCandidate)
 *   - This store can then be removed or repurposed for optimistic UI state only
 */

import { create } from 'zustand';
import type { CandidateRow } from '../components/CandidateModal';

// ─── Shared positions (matches seed.sql) ─────────────────────────────────────
export interface PositionRow {
  id:            string;
  position_name: string;
  display_order: number;
}

export const POSITIONS: PositionRow[] = [
  { id: 'p1', position_name: 'Executive President',      display_order: 1 },
  { id: 'p2', position_name: 'Executive Vice President', display_order: 2 },
  { id: 'p3', position_name: 'Secretary General',        display_order: 3 },
  { id: 'p4', position_name: 'Treasurer',                display_order: 4 },
  { id: 'p5', position_name: 'Auditor',                  display_order: 5 },
  { id: 'p6', position_name: 'Public Relations Officer', display_order: 6 },
  { id: 'p7', position_name: '1st Year Representative',  display_order: 7 },
  { id: 'p8', position_name: '2nd Year Representative',  display_order: 8 },
];

// ─── Seed candidates (realistic dummy data with party color accents) ──────────
const SEED_CANDIDATES: CandidateRow[] = [
  {
    id: 'c1',
    name: 'Maria Santos',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p1',
    photo_url: null,
    email: 'maria.santos@dlsl.edu.ph',
    credentials:
      "Former Student Council Secretary · Dean's Lister 6 consecutive semesters · Model Lasallian Awardee 2024 · National Youth Leadership Forum Delegate",
    platform:
      'Strengthen academic support programs through peer tutoring hubs, improve campus-wide Wi-Fi infrastructure, and establish a 24/7 student wellness hotline with licensed counselors.',
    Positions: { position_name: 'Executive President' },
  },
  {
    id: 'c2',
    name: 'Juan dela Cruz',
    partylist: 'Sama-Sama',
    position_id: 'p1',
    photo_url: null,
    email: 'juan.delacruz@dlsl.edu.ph',
    credentials:
      'President of JPIA · 2× Campus Journalism Awardee · DLSL Student Ambassador 2023 · Regional Debate Champion',
    platform:
      'Transparent governance with open budget reporting, expanded merit-based scholarships for underprivileged students, and stronger student-administration communication linkages.',
    Positions: { position_name: 'Executive President' },
  },
  {
    id: 'c3',
    name: 'Angela Reyes',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p2',
    photo_url: null,
    email: 'angela.reyes@dlsl.edu.ph',
    credentials:
      'VP of CCS Student Council · Academic Excellence Awardee · Coding Bootcamp Facilitator · Google Developer Student Club Lead',
    platform:
      'Digitize student services through a unified campus app, create a centralized org calendar, and push for mandatory mental health days and stress-relief programs.',
    Positions: { position_name: 'Executive Vice President' },
  },
  {
    id: 'c4',
    name: 'Ben Pascual',
    partylist: 'Sama-Sama',
    position_id: 'p2',
    photo_url: null,
    email: 'ben.pascual@dlsl.edu.ph',
    credentials:
      'VP of CEA Council · Engineering Excellence Awardee · Student Publication Editor · DLSL STEM Olympiad Gold Medalist',
    platform:
      'Bridge the gap between student organizations and administration through monthly open forums, establish a cross-department project grant, and improve student amenities.',
    Positions: { position_name: 'Executive Vice President' },
  },
  {
    id: 'c5',
    name: 'Carlos Mendoza',
    partylist: 'Sama-Sama',
    position_id: 'p3',
    photo_url: null,
    email: 'carlos.mendoza@dlsl.edu.ph',
    credentials:
      'Secretary of ROTC · Publication Coordinator · Consistent Honors Student · Regional Youth Congress Delegate 2023',
    platform:
      'Streamline student-admin communication through a transparent digital bulletin system, automate meeting documentation, and create a student feedback portal.',
    Positions: { position_name: 'Secretary General' },
  },
  {
    id: 'c6',
    name: 'Diane Flores',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p3',
    photo_url: null,
    email: 'diane.flores@dlsl.edu.ph',
    credentials:
      'Class Secretary 3 consecutive years · Journalism Club President · Honors Student · Best Secretary Awardee 2024',
    platform:
      'Modernize documentation and meeting processes using digital tools. Establish a campus-wide bulletin board and a student concerns tracker with SLA commitments.',
    Positions: { position_name: 'Secretary General' },
  },
  {
    id: 'c7',
    name: 'Patricia Lim',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p4',
    photo_url: null,
    email: 'patricia.lim@dlsl.edu.ph',
    credentials:
      'Treasurer of Accounting Society · CPA Board Passer (Top 10) · Accounting Excellence Awardee · Junior CFA Scholar',
    platform:
      'Institute strict financial transparency with publicly accessible budget reports, student org budget reform with equitable allocation, and accessible emergency funding.',
    Positions: { position_name: 'Treasurer' },
  },
  {
    id: 'c8',
    name: 'Kevin Tan',
    partylist: 'Sama-Sama',
    position_id: 'p4',
    photo_url: null,
    email: 'kevin.tan@dlsl.edu.ph',
    credentials:
      'Finance Committee Head · Business Quiz Bee Champion 2023 · Consistent Dean\'s Lister · Young Entrepreneurs Program Graduate',
    platform:
      'Create a transparent digital treasury system, establish a student emergency fund, and negotiate with the admin for reduced org registration fees.',
    Positions: { position_name: 'Treasurer' },
  },
  {
    id: 'c9',
    name: 'Renzo Garcia',
    partylist: 'Sama-Sama',
    position_id: 'p5',
    photo_url: null,
    email: 'renzo.garcia@dlsl.edu.ph',
    credentials:
      'Internal Auditor of JPIA · Accounting Honor Society Member · Leadership Excellence Awardee · PICPA Student Affiliate',
    platform:
      'Implement independent audit reviews for all SG financial transactions, create a whistleblower-friendly accountability system, and publish quarterly financial summaries.',
    Positions: { position_name: 'Auditor' },
  },
  {
    id: 'c10',
    name: 'Sofia Cruz',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p6',
    photo_url: null,
    email: 'sofia.cruz@dlsl.edu.ph',
    credentials:
      'Marketing Head of CEA Council · Social Media Manager for DLSL Events · PR Excellence Awardee · National Communications Conference Speaker',
    platform:
      "Revamp DLSL's student social media presence with a dedicated team, launch a unified student news platform, and improve event promotion for all student orgs.",
    Positions: { position_name: 'Public Relations Officer' },
  },
  {
    id: 'c11',
    name: 'Marco Villanueva',
    partylist: 'Sama-Sama',
    position_id: 'p6',
    photo_url: null,
    email: 'marco.v@dlsl.edu.ph',
    credentials:
      "School Publication Writer · Communications Club Head · Dean's List 4 semesters · Regional Journalism Awardee",
    platform:
      'Create a student-run media team covering all DLSL events, establish a verified student news channel, and advocate for student press freedom and responsible reporting.',
    Positions: { position_name: 'Public Relations Officer' },
  },
  {
    id: 'c12',
    name: 'Liam Torres',
    partylist: 'Sama-Sama',
    position_id: 'p7',
    photo_url: null,
    email: 'liam.torres@dlsl.edu.ph',
    credentials:
      'DLSL Freshman Class President 2024 · Debate Team Captain · Academic Excellence Awardee · National High School Press Conference Delegate',
    platform:
      'Create a dedicated first-year orientation committee, establish a peer mentoring network pairing freshmen with upper-year students, and launch a freshman survival guide app.',
    Positions: { position_name: '1st Year Representative' },
  },
  {
    id: 'c13',
    name: 'Bianca Reyes',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p8',
    photo_url: null,
    email: 'bianca.reyes@dlsl.edu.ph',
    credentials:
      '2nd Year Class Representative 2024 · Consistent Academic Excellence Awardee · Student Welfare Committee Member · Regional Youth Leader',
    platform:
      'Improve second-year student resources, advocate for more org-funding opportunities, and create a sophomore transition program to ease the shift from freshman year.',
    Positions: { position_name: '2nd Year Representative' },
  },
  {
    id: 'c14',
    name: 'Alicia Bautista',
    partylist: 'Sama-Sama',
    position_id: 'p8',
    photo_url: null,
    email: 'alicia.bautista@dlsl.edu.ph',
    credentials:
      'Student Government Committee Member · Campus Ministry Leader · Honors Student · Volunteer Coordinator for DLSL Outreach',
    platform:
      'Strengthen 2nd year student community through regular socials, create a dedicated study space, and establish a second-year student concerns desk with direct admin access.',
    Positions: { position_name: '2nd Year Representative' },
  },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
let _idCounter = 100;
export function generateId(): string {
  return `local_${Date.now()}_${++_idCounter}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface CandidateStoreState {
  candidates: CandidateRow[];

  /** Add a new candidate. Returns the created candidate. */
  addCandidate:    (data: Omit<CandidateRow, 'id'>) => CandidateRow;
  /** Update an existing candidate by id. */
  updateCandidate: (id: string, data: Partial<Omit<CandidateRow, 'id'>>) => void;
  /** Remove a candidate by id. */
  deleteCandidate: (id: string) => void;
  /** Get all candidates for a specific position. */
  getCandidatesForPosition: (positionId: string) => CandidateRow[];
}

export const useCandidateStore = create<CandidateStoreState>((set, get) => ({
  candidates: SEED_CANDIDATES,

  addCandidate: (data) => {
    const position = POSITIONS.find(p => p.id === data.position_id);
    const newCandidate: CandidateRow = {
      ...data,
      id: generateId(),
      Positions: position ? { position_name: position.position_name } : null,
    };
    set(state => ({ candidates: [...state.candidates, newCandidate] }));
    return newCandidate;
  },

  updateCandidate: (id, data) => {
    set(state => ({
      candidates: state.candidates.map(c => {
        if (c.id !== id) return c;
        const position = data.position_id
          ? POSITIONS.find(p => p.id === data.position_id)
          : undefined;
        return {
          ...c,
          ...data,
          Positions: position ? { position_name: position.position_name } : c.Positions,
        };
      }),
    }));
  },

  deleteCandidate: (id) => {
    set(state => ({ candidates: state.candidates.filter(c => c.id !== id) }));
  },

  getCandidatesForPosition: (positionId) => {
    return get().candidates.filter(c => c.position_id === positionId);
  },
}));