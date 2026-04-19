// ─── Root ────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth:    undefined;
  Student: undefined;
  Admin:   undefined;
};

// ─── Auth stack ──────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

// ─── Student bottom tabs ─────────────────────────────────────────────────────
export type StudentTabParamList = {
  FeedTab:    undefined;
  VoteTab:    undefined;
  MitingTab:  undefined;
  ProfileTab: undefined;
};

// ─── Feed stack (nested inside FeedTab) ──────────────────────────────────────
export type FeedStackParamList = {
  FeedList:         undefined;
  PostDetail:       { postId: string };
  CandidateProfile: { candidateId: string };
};

// ─── Vote stack (nested inside VoteTab) ──────────────────────────────────────
// Mirrors existing app/(student)/vote/ structure: index → [positionID] → confirm
export type VoteStackParamList = {
  BallotList:  undefined;
  BallotDetail: { positionId: string };
  VoteConfirm: undefined;
  LiveResults: undefined;
};

// ─── Admin bottom tabs ───────────────────────────────────────────────────────
export type AdminTabParamList = {
  DashboardTab:  undefined;
  CandidatesTab: undefined;
  PostsTab:      undefined;
  SettingsTab:   undefined;
};

// ─── Candidates stack (nested inside CandidatesTab) ──────────────────────────
export type CandidatesStackParamList = {
  CandidateList: undefined;
  CandidateEdit: { candidateId: string };
  CandidateCreate: undefined;
};

// ─── Settings stack (nested inside SettingsTab) ──────────────────────────────
export type SettingsStackParamList = {
  SystemSettings: undefined;
  AuditLogs:      undefined;
  UserManagement: undefined;
  VoteTally:      undefined;
};