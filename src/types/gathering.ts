// 소모임 공용 타입 (스키마: supabase/migrations/20260717000000_gatherings_v2.sql)

/**
 * 소모임의 성격. 태그가 아니라 **상태 규칙을 고르는 스위치**다.
 * - oneday    한 번 모이는 번개. gathering_at 이 반드시 있고, 시간이 끝낸다.
 * - challenge 기한 없이 지속되는 모임(통독반·마라톤). gathering_at 이 없고, 사람이 끝낸다.
 *
 * 그래서 카테고리(☕️ 카페)로 뺄 수 없다 — 카테고리는 표시만 하는 텍스트다.
 */
export type GatheringKind = "oneday" | "challenge";

export interface GatheringRecord {
  id: string;
  kind: GatheringKind;
  title: string;
  description: string | null;
  /** 챌린지는 null. DB check 제약으로 강제된다 */
  gathering_at: string | null;
  place_name: string | null;
  /** 참가자 누구나 장소를 고칠 수 있다. 마지막에 쓴 사람이 이기므로 책임 소재만 남긴다 */
  place_updated_by: string | null;
  place_updated_at: string | null;
  category_id: string | null;
  /** 없으면 카테고리 이모지, 그것도 없으면 기본 아이콘으로 떨어진다 */
  thumbnail_url: string | null;
  /** 리더가 계정을 지우면 null 이 될 수 있다(모임은 리더보다 오래 산다) */
  leader_id: string | null;
  /** 참여 신청 마감. 종료가 아니다 */
  closed_at: string | null;
  /** 종료. 챌린지는 시간으로 안 끝나서 이 컬럼이 필요하다 */
  ended_at: string | null;
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

export interface GatheringReview {
  id: string;
  gathering_id: string;
  /** 계정이 지워져도 후기는 남는다 — 그때 null 이 된다 */
  user_id: string | null;
  content: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * 카테고리는 멤버가 직접 만들 수 있어서 DB 테이블이다(코드 상수가 아니다).
 * 코드는 목록을 하드코딩하지 않고 읽기만 한다.
 */
export interface GatheringCategory {
  id: string;
  emoji: string;
  label: string;
}

export interface GatheringDraft {
  kind: GatheringKind;
  title: string;
  gathering_at: string | null;
  place_name: string | null;
  description: string | null;
  category_id: string | null;
  thumbnail_url: string | null;
}
