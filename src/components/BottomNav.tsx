import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/home", icon: "ti-home", label: "홈" },
  { to: "/surveys", icon: "ti-chart-bar", label: "설문" },
  { to: "/vote", icon: "ti-tools-kitchen-2", label: "메뉴" },
  { to: "/worship", icon: "ti-music", label: "찬양팀" },
  { to: "/member/setup", icon: "ti-user", label: "내정보" },
];

export default function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 bg-card border-t border-line-soft flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2 transition ${
              isActive ? "text-info" : "text-fg-faint hover:text-fg-muted"
            }`
          }
        >
          <i className={`ti ${t.icon} text-2xl`} aria-hidden="true" />
          <span className="text-caption font-medium">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
