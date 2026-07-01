import { NavLink } from "react-router-dom";
import { HomeIcon, CalendarIcon, PhotographIcon, MusicNoteIcon, UserIcon } from "@heroicons/react/outline";
import type { ComponentType, SVGProps } from "react";

const TABS: { to: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; label: string }[] = [
  { to: "/home", Icon: HomeIcon, label: "홈" },
  { to: "/events", Icon: CalendarIcon, label: "행사" },
  { to: "/gallery", Icon: PhotographIcon, label: "갤러리" },
  { to: "/worship", Icon: MusicNoteIcon, label: "찬양팀" },
  { to: "/member/setup", Icon: UserIcon, label: "내정보" },
];

export default function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 bg-card border-t border-line-soft rounded-t-[20px] px-2 pt-3"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around">
        {TABS.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition ${
                isActive ? "text-info" : "text-fg-faint"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className={`text-caption ${isActive ? "font-medium" : ""}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
