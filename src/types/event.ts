// 행사 기능 공용 타입

export interface EventRecord {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  place_name: string | null;
  image_url: string | null;
  results_public: boolean;
  status: string;
}

export interface Segment {
  id: string;
  duration_min: number;
  title: string;
  description: string | null;
  sort: number;
}

export interface Evaluation {
  id: string;
  segment_id: string;
  user_id: string | null;
  nickname: string | null;
  mood: number | null;
  comment: string | null;
}
