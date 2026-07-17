import { Outlet } from "react-router-dom";

/** 앱 셸: 앱 프레임(max-w-md) + 스크롤 영역. 배경은 전역(index.css).
 *
 *  탭바는 지금 없다. 옛 sticky 탭바를 걷어냈고, 새 탭바는 "떠 있는 글래스 캡슐"로
 *  다시 붙일 예정이다(docs/design.md). 캡슐은 자리를 차지하지 않고 콘텐츠 위에 뜨므로
 *  하단 여백은 탭바가 아니라 각 페이지가 확보한다 — PAGE_BOTTOM_PAD 를 쓴다. */
export default function Layout() {
  return (
    <div className="h-dvh mx-auto w-full max-w-md flex flex-col overflow-hidden">
      <main
        className="flex-1 flex flex-col overflow-y-auto min-h-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
