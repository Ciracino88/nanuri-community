// 탭별 테마색 (하단 탭바 · 로딩 스피너 등 공용)
export const TAB_COLORS = {
  home: "#4ECDC4",
  // 소모임이 행사 탭 자리를 물려받아 같은 톤을 쓴다. 행사는 홈에서만 진입한다.
  gatherings: "#FFB347",
  events: "#FFB347",
  gallery: "#C77DFF",
  worship: "#FF6B6B",
  profile: "#74C7FF",
  admin: "#C77DFF",
} as const;
