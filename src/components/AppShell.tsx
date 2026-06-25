import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppShell() {
  return (
    <div className="min-h-screen mx-auto w-full max-w-md bg-surface flex flex-col">
      <main className="flex-1 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
