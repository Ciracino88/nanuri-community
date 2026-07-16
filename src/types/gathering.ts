// 소모임(번개) 공용 타입

export interface GatheringRecord {
  id: string;
  title: string;
  gathering_at: string;
  place_name: string | null;
  description: string | null;
  emoji: string | null;
  created_by: string;
  closed_at: string | null;
}

export interface GatheringParticipant {
  gathering_id: string;
  user_id: string;
}

/** 참여자 아이콘용 최소 프로필 (public_profiles 뷰) */
export interface ParticipantProfile {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface GatheringDraft {
  title: string;
  gathering_at: string;
  place_name: string | null;
  description: string | null;
  emoji: string | null;
}
