import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

/** 앱 셸: 다크 캔버스 프레임(max-w-md) + 스크롤 영역 + 하단 탭바. 배경은 전역(index.css). */
export default function Layout() {
  return (
    <div className="h-dvh mx-auto w-full max-w-md flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col overflow-y-auto min-h-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
