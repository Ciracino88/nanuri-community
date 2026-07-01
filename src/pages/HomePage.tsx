import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import PageContainer from "../components/PageContainer";

interface MenuCard {
  icon: string;
  title: string;
  description: string;
  path: string;
  tint: string;
  color: string;
}

const ADMIN_CARDS: MenuCard[] = [
  { icon: "ti-currency-won", title: "회계 보고서", description: "지출 내역 관리", path: "/accounting", tint: "bg-info-subtle", color: "text-info" },
  { icon: "ti-calendar-event", title: "행사 관리", description: "행사·순서 구성", path: "/admin/events", tint: "bg-purple-subtle", color: "text-purple" },
];

/** 오늘 기준 다음 주일까지 남은 일수 */
function daysUntilSunday(): { dday: number; date: Date } {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);
  return { dday: diff, date };
}

interface Pill {
  label: string;
  className: string;
}

function ActionRow({
  icon,
  iconColor,
  iconTint,
  title,
  sub,
  pill,
  delay,
  onClick,
}: {
  icon: string;
  iconColor: string;
  iconTint: string;
  title: string;
  sub: string;
  pill?: Pill;
  delay: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-line-soft rounded-2xl p-3.5 flex items-center gap-3.5 text-left hover:border-line active:scale-[0.98] transition"
      style={{ animation: `fadeUp 0.45s ease ${delay}s both` }}
    >
      <div className={`w-11 h-11 rounded-xl ${iconTint} flex items-center justify-center shrink-0`}>
        <i className={`ti ${icon} text-2xl ${iconColor}`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-body font-medium text-fg-strong">{title}</p>
        <p className="text-caption text-fg-faint mt-0.5">{sub}</p>
      </div>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {pill && (
          <span className={`text-caption font-medium rounded-full px-2.5 py-1 ${pill.className}`}>
            {pill.label}
          </span>
        )}
        <i className="ti ti-chevron-right text-fg-faint text-emphasis" aria-hidden="true" />
      </div>
    </button>
  );
}

function FeatureCard({ card, delay, onClick }: { card: MenuCard; delay: number; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="bg-card border border-line-soft rounded-2xl p-4 text-left flex flex-col gap-3 hover:border-line active:scale-95 transition"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s, border-color 0.2s, scale 0.12s`,
      }}
    >
      <div className={`w-11 h-11 rounded-xl ${card.tint} flex items-center justify-center`}>
        <i className={`ti ${card.icon} text-2xl ${card.color}`} aria-hidden="true" />
      </div>
      <div>
        <p className="text-body font-medium text-fg-strong">{card.title}</p>
        <p className="text-caption text-fg-faint mt-0.5">{card.description}</p>
      </div>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();
  const isAdmin = userProfile?.role === "admin";

  const { dday, date: nextSunday } = daysUntilSunday();
  const ddayLabel = dday === 0 ? "오늘" : `D-${dday}`;

  return (
    <PageContainer width="default">

      {/* 히어로 */}
      <div
        className="relative bg-inverse rounded-2xl p-6 overflow-hidden"
        style={{ animation: "cardEnter 0.4s ease both" }}
      >
        <i
          className="ti ti-seeding absolute"
          aria-hidden="true"
          style={{ right: 4, bottom: 0, fontSize: 88, color: "rgba(255,255,255,0.08)", animation: "float 4s ease-in-out infinite" }}
        />
        <p className="text-caption mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>나누리 청년부</p>
        <p className="text-title font-medium text-white leading-snug">
          우리들의 작은<br />커뮤니티 공간
        </p>
      </div>

      {/* 바로 하기 액션 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-caption text-fg-faint font-medium">바로 하기</p>

        <ActionRow
          icon="ti-music"
          iconColor="text-teal"
          iconTint="bg-teal-subtle"
          title="찬양팀 시트 작성"
          sub={`${nextSunday.getMonth() + 1}월 ${nextSunday.getDate()}일 주일`}
          pill={{ label: ddayLabel, className: "text-teal bg-teal-subtle" }}
          delay={0.08}
          onClick={() => navigate("/worship")}
        />

        <ActionRow
          icon="ti-camera"
          iconColor="text-pink"
          iconTint="bg-pink-subtle"
          title="사진 업로드"
          sub="갤러리에 추억 남기기"
          delay={0.14}
          onClick={() => navigate("/gallery")}
        />

        <ActionRow
          icon="ti-message-2"
          iconColor="text-amber"
          iconTint="bg-amber-subtle"
          title="안건·피드백 작성"
          sub="의견을 남겨주세요"
          pill={{ label: "준비 중", className: "text-fg-faint bg-surface" }}
          delay={0.2}
          onClick={() => toast("곧 만나요! 준비 중인 기능이에요", { icon: "💬" })}
        />
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-2.5">
          <p className="text-caption text-fg-faint font-medium">관리자</p>
          <div className="grid grid-cols-2 gap-3">
            {ADMIN_CARDS.map((card, i) => (
              <FeatureCard key={card.path} card={card} delay={i * 0.07} onClick={() => navigate(card.path)} />
            ))}
          </div>
        </div>
      )}

    </PageContainer>
  );
}
