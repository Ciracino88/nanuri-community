import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import PageContainer from "../components/PageContainer";
import { useActiveSurveys } from "../hooks/useActiveSurveys";
import { useRespondedIds } from "../hooks/useRespondedIds";

interface MenuCard {
  icon: string;
  title: string;
  description: string;
  path: string;
  tint: string;
  color: string;
}

const MENU_CARDS: MenuCard[] = [
  { icon: "ti-credit-card", title: "청구서 제출", description: "영수증 올리고 송금받기", path: "/member/form", tint: "bg-info-subtle", color: "text-info" },
  { icon: "ti-chart-bar", title: "설문 참여", description: "링크로 바로 참여", path: "/surveys", tint: "bg-purple-subtle", color: "text-purple" },
  { icon: "ti-salad", title: "메뉴 종합", description: "사진 올리면 AI 정리", path: "/vote", tint: "bg-warning-subtle", color: "text-warning" },
  { icon: "ti-music", title: "찬양팀 일정", description: "주일 포지션 등록", path: "/worship", tint: "bg-teal-subtle", color: "text-teal" },
];

const ADMIN_CARDS: MenuCard[] = [
  { icon: "ti-currency-won", title: "회계 보고서", description: "지출 내역 관리", path: "/accounting", tint: "bg-info-subtle", color: "text-info" },
  { icon: "ti-chart-bar", title: "설문 관리", description: "설문 작성·배포", path: "/admin/surveys", tint: "bg-purple-subtle", color: "text-purple" },
];

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
  const { userProfile, user } = useAuthStore();
  const isAdmin = userProfile?.role === "admin";
  const { surveys } = useActiveSurveys();
  const respondedIds = useRespondedIds(user?.id);

  const unrespondedCount = surveys.filter((s) => !respondedIds.has(s.id)).length;

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

      {unrespondedCount > 0 && (
        <div className="bg-info-subtle rounded-2xl p-4 border border-info-soft flex items-center justify-between">
          <div>
            <p className="text-caption text-info font-medium mb-0.5">진행 중인 설문</p>
            <p className="text-body font-medium text-fg-strong">참여 가능한 설문이 {unrespondedCount}개 있습니다</p>
          </div>
          <button
            onClick={() => navigate("/surveys")}
            className="text-body text-info font-medium whitespace-nowrap ml-3"
          >
            보러가기 →
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <p className="text-caption text-fg-faint font-medium">메뉴</p>
        <div className="grid grid-cols-2 gap-3">
          {MENU_CARDS.map((card, i) => (
            <FeatureCard key={card.path} card={card} delay={i * 0.07} onClick={() => navigate(card.path)} />
          ))}
        </div>
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
