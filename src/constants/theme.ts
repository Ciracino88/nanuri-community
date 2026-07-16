// 상호작용 액센트. 앱 전체에서 "누를 수 있음"을 뜻하는 유일한 색이다.
// (버튼·활성 탭·선택 상태·링크). Tailwind 쪽 대응 토큰은 `--color-accent`.
// 인라인 style·SVG fill 처럼 클래스를 못 쓰는 자리에서만 이 상수를 쓴다.
export const ACCENT = "#8b3dff";

// 비활성·보조 (탭바 캐릭터, 라벨). `--color-fg-muted` 와 같은 값.
export const MUTED = "#75757f";

/**
 * 장식·식별 전용 팔레트. **누를 수 있는 것에는 쓰지 않는다** — 그건 ACCENT 담당.
 * 라이트 배경에서 읽히도록 재조정됨(기존 값은 다크 배경용 파스텔이라 흰 배경에서 물 빠짐).
 * 퍼플 계열은 액센트가 독점하므로 여기 없다 (갤러리·관리자가 퍼플 → 핑크·시안으로 이동).
 *
 * @deprecated 이름이 "탭 색"이지만 탭바는 더 이상 이걸 쓰지 않는다(활성=ACCENT 단일).
 * 남은 용도는 이벤트 점 색·페이지 장식뿐. 3단계에서 호출부를 카테고리 틴트 토큰
 * (`bg-teal-subtle` 등)으로 옮기고 이 상수는 삭제할 것.
 */
export const TINT_COLORS = {
  home: "#0D9276",
  // 소모임이 행사 탭 자리를 물려받아 같은 톤을 쓴다. 행사는 홈에서만 진입한다.
  gatherings: "#D97706",
  events: "#D97706",
  gallery: "#DB2777",
  worship: "#E11D48",
  profile: "#2563EB",
  admin: "#0891B2",
} as const;

/** @deprecated `TINT_COLORS` 로 이름이 바뀜. 호출부 정리 전까지 남겨둔 별칭. */
export const TAB_COLORS = TINT_COLORS;
