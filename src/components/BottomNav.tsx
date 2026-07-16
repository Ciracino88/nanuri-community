import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { CreatureIcon, type CreatureKind } from "./nav/creatures";
import { ACCENT, MUTED } from "../constants/theme";
import { useAuthStore } from "../store/authStore";

type Tab = { to: string; label: string; kind: CreatureKind };

const HOME: Tab = { to: "/home", label: "홈", kind: "home" };
// 행사보다 소모임 빈도가 높아 이 자리를 소모임에 내줬다. 행사는 홈에서 진입한다.
const GATHERINGS: Tab = { to: "/gatherings", label: "소모임", kind: "schedule" };
const GALLERY: Tab = { to: "/gallery", label: "갤러리", kind: "gallery" };
const ADMIN: Tab = { to: "/admin", label: "관리자", kind: "admin" };
const WORSHIP: Tab = { to: "/worship", label: "찬양팀", kind: "songs" };
const PROFILE: Tab = { to: "/profile", label: "내정보", kind: "profile" };

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
      className="sticky bottom-0 px-3 pt-2 bg-card/92 border-t border-line rounded-t-2xl overflow-hidden"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 -2px 16px rgb(23 23 28 / 0.05)",
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-end justify-around">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className="flex flex-col items-center gap-0.5 relative"
            style={{ minWidth: 56 }}
          >
            {({ isActive }) => {
              // 활성 표시는 아이콘 색 하나로만 한다. 글로우 알약과 점을 얹으면
              // 같은 사실을 세 번 말하게 되고, 토스처럼 조용한 탭바가 안 된다.
              const color = isActive ? ACCENT : MUTED;
              return (
                <>
                  <motion.div
                    animate={isActive ? { scale: 1.08 } : { scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  >
                    <CreatureIcon
                      kind={tab.kind}
                      active={isActive}
                      mousePos={mousePos}
                      blink={blinkingTab === tab.to && blink}
                      color={color}
                    />
                  </motion.div>

                  {/* 라벨은 활성이어도 회색. 색은 아이콘 몫이다. */}
                  <span className="text-micro font-semibold" style={{ color: MUTED }}>
                    {tab.label}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
