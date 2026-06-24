import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/Navbar";
import { useActiveSurveys } from "../hooks/useActiveSurveys";
import { useRespondedIds } from "../hooks/useRespondedIds";

interface MenuCard {
  icon: string;
  title: string;
  description: string;
  path: string;
}

const MENU_CARDS: MenuCard[] = [
  { icon: "ti-credit-card", title: "청구서 제출", description: "청구 내용과 금액, 영수증을 제출하면 관리자가 확인 후 송금해드려요", path: "/member/form" },
  { icon: "ti-chart-bar", title: "설문 참여", description: "로그인 없이 링크만으로 설문에 참여하고 결과를 실시간으로 확인해요", path: "/surveys" },
  { icon: "ti-salad", title: "메뉴 종합", description: "메뉴판 사진을 올리면 AI가 메뉴를 추출하고 모두의 선택을 모아줘요", path: "/vote" },
  { icon: "ti-music", title: "찬양팀 일정", description: "포지션별 주일 참여 가능 여부를 확인하고 내 일정을 등록해요", path: "/worship" },
];

const ADMIN_CARDS: MenuCard[] = [
  { icon: "ti-currency-won", title: "회계 보고서", description: "지출 내역을 한눈에 조회하고 관리해요", path: "/accounting" },
  { icon: "ti-chart-bar", title: "설문 관리", description: "설문을 작성하고 링크로 배포해요", path: "/admin/surveys" },
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
      className="bg-card border border-line-soft rounded-2xl p-6 text-left hover:border-line hover:shadow-sm transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s, box-shadow 0.2s, border-color 0.2s`,
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-surface border border-line-soft flex items-center justify-center mb-3">
        <i className={`ti ${card.icon} text-xl text-fg-muted`} aria-hidden="true" />
      </div>
      <p className="text-body font-medium text-fg-strong mb-1.5">{card.title}</p>
      <p className="text-caption text-fg-faint leading-relaxed">{card.description}</p>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { userProfile, signOut, user } = useAuthStore();
  const isAdmin = userProfile?.role === "admin";
  const { surveys } = useActiveSurveys();
  const respondedIds = useRespondedIds(user?.id);

  const unrespondedCount = surveys.filter((s) => !respondedIds.has(s.id)).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}
        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-6">

        {unrespondedCount > 0 && (
          <div className="bg-info-subtle rounded-xl p-4 border border-info-soft flex items-center justify-between">
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
          <div className="flex flex-col gap-2.5">
            {MENU_CARDS.map((card, i) => (
              <FeatureCard key={card.path} card={card} delay={i * 0.1} onClick={() => navigate(card.path)} />
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-2.5">
            <p className="text-caption text-fg-faint font-medium">관리자</p>
            <div className="flex flex-col gap-2.5">
              {ADMIN_CARDS.map((card, i) => (
                <FeatureCard key={card.path} card={card} delay={i * 0.1} onClick={() => navigate(card.path)} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
