import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { CreatureIcon, type CreatureKind } from "./nav/creatures";
import { TAB_COLORS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";

type Tab = { to: string; label: string; kind: CreatureKind; color: string };

const HOME: Tab = { to: "/home", label: "홈", kind: "home", color: TAB_COLORS.home };
// 행사보다 소모임 빈도가 높아 이 자리를 소모임에 내줬다. 행사는 홈에서 진입한다.
const GATHERINGS: Tab = { to: "/gatherings", label: "소모임", kind: "schedule", color: TAB_COLORS.gatherings };
const GALLERY: Tab = { to: "/gallery", label: "갤러리", kind: "gallery", color: TAB_COLORS.gallery };
const ADMIN: Tab = { to: "/admin", label: "관리자", kind: "admin", color: TAB_COLORS.admin };
const WORSHIP: Tab = { to: "/worship", label: "찬양팀", kind: "songs", color: TAB_COLORS.worship };
const PROFILE: Tab = { to: "/profile", label: "내정보", kind: "profile", color: TAB_COLORS.profile };

export default function BottomNav() {
  const { userProfile } = useAuthStore();
  const isAdmin = userProfile?.role === "admin";
  // 관리자는 갤러리 자리에 관리자 탭
  const TABS: Tab[] = [HOME, GATHERINGS, isAdmin ? ADMIN : GALLERY, WORSHIP, PROFILE];

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [blink, setBlink] = useState(false);
  const [blinkingTab, setBlinkingTab] = useState<string | null>(null);

  // 마우스 추적 (데스크톱). 모바일은 이벤트가 없어 정면 응시.
  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // 랜덤 탭 깜빡임
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let inner: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 1500 + Math.random() * 3000;
      timer = setTimeout(() => {
        const tab = TABS[Math.floor(Math.random() * TABS.length)];
        setBlinkingTab(tab.to);
        setBlink(true);
        inner = setTimeout(() => {
          setBlink(false);
          setBlinkingTab(null);
          schedule();
        }, 150);
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      clearTimeout(inner);
    };
  }, []);

  return (
    <nav
      className="sticky bottom-0 px-3 pt-3"
      style={{
        background: "rgba(20,22,30,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-end justify-around">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className="flex flex-col items-center gap-1.5 relative"
            style={{ minWidth: 56 }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="tabGlow"
                    className="absolute -inset-2 rounded-2xl"
                    style={{ background: `${tab.color}18`, zIndex: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  className="relative z-10"
                  animate={isActive ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  <CreatureIcon
                    kind={tab.kind}
                    active={isActive}
                    mousePos={mousePos}
                    blink={blinkingTab === tab.to && blink}
                    color={tab.color}
                  />
                </motion.div>

                <motion.span
                  className="text-caption font-bold relative z-10"
                  animate={{ color: isActive ? tab.color : "#4a5568" }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.span>

                {isActive && (
                  <motion.div
                    layoutId="tabDot"
                    className="w-1 h-1 rounded-full"
                    style={{ background: tab.color }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
