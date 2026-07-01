import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppShell() {
  return (
    <div className="h-dvh mx-auto w-full max-w-md bg-surface flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col overflow-y-auto min-h-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
