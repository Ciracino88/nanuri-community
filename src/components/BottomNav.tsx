import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { CreatureIcon, type CreatureKind } from "./nav/creatures";
import { ACCENT, MUTED } from "../constants/theme";

type Tab = { to: string; label: string; kind: CreatureKind };

// 탭은 셋뿐이다. 홈은 소모임에 흡수됐고(행사 카드가 소모임 화면 상단으로 올라간다),
// 갤러리는 빈 껍데기라 지웠으며, 관리자는 탭이 아니라 내정보에서 진입한다.
const GATHERINGS: Tab = { to: "/gatherings", label: "소모임", kind: "schedule" };
const WORSHIP: Tab = { to: "/worship", label: "찬양팀", kind: "songs" };
const PROFILE: Tab = { to: "/profile", label: "내정보", kind: "profile" };

const TABS: Tab[] = [GATHERINGS, WORSHIP, PROFILE];

/** 떠 있는 글래스 캡슐 탭바(docs/design.md). 화면 하단에 붙지 않고 살짝 띄운다 —
 *  위치(중앙 하단·바닥 띄움)는 Layout 이 잡고, 이 컴포넌트는 캡슐 자체만 그린다.
 *  면은 테두리가 아니라 그림자로 띄워 분리한다(shadow-large + 반투명 유리). */
export default function BottomNav() {

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
      className="pointer-events-auto flex items-end gap-1 rounded-full bg-bg-normal/80 px-3 py-2 shadow-large"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className="flex flex-col items-center gap-0.5 relative px-3 py-1"
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
                <span className="text-caption1 font-semibold" style={{ color: MUTED }}>
                  {tab.label}
                </span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}
