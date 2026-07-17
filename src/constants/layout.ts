/** 페이지 하단 여백.
 *
 *  탭바가 "떠 있는 캡슐"이라 자리를 차지하지 않고 콘텐츠 위에 뜬다. 그래서 마지막 항목이
 *  캡슐에 가리지 않으려면 페이지가 직접 그만큼을 비워야 한다. 옛 sticky 탭바는 자리를
 *  차지했으므로 이 값이 필요 없었다.
 *
 *  캡슐 높이(약 64) + 바닥 띄움(16) + 여유(16) + 홈바 안전영역. */
export const PAGE_BOTTOM_PAD = "calc(6rem + env(safe-area-inset-bottom))";

/** 플로팅 버튼이 캡슐 위에 얹히는 화면용(소모임 목록의 "만들기" FAB).
 *
 *  캡슐과 FAB 는 화면 하단에서 가로로 겹친다 — 캡슐은 중앙, FAB 는 우하단이라 좁은 폭에서
 *  서로 포갠다. 그래서 FAB 를 캡슐 위로 올리고(그 페이지에서 bottom 을 캡슐 높이만큼 준다),
 *  마지막 항목이 그 FAB 에도 가리지 않도록 여백을 캡슐 몫보다 더 비운다. */
export const PAGE_BOTTOM_PAD_WITH_FAB = "calc(9rem + env(safe-area-inset-bottom))";
