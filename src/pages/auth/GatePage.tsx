import { useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import LoadingScreen from "../../components/LoadingScreen";

interface GuestCard {
  icon: string;
  title: string;
  description: string;
  tint: string;
  color: string;
  action: () => void;
}

export default function GatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const { user, isAnonymous, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (user && !isAnonymous) return <Navigate to="/home" replace />;

  const handleBillCard = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) navigate("/guest/form");
    setLoading(false);
  };

  const GUEST_CARDS: GuestCard[] = [
    {
      icon: "ti-credit-card",
      title: "비용 청구서",
      description: "영수증 올리고 송금받기",
      tint: "bg-info-subtle",
      color: "text-info",
      action: handleBillCard,
    },
  ];

  if (guestMode) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col gap-6 animate-[fadeUp_0.4s_ease_both]">

          <div className="flex flex-col gap-1.5">
            <p className="text-caption text-fg-faint">외부 방문자</p>
            <h2 className="text-title font-medium text-fg-strong">무엇을 도와드릴까요?</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {GUEST_CARDS.map((card) => (
              <button
                key={card.title}
                onClick={card.action}
                disabled={loading}
                className="bg-card border border-line-soft rounded-2xl p-4 text-left flex flex-col gap-3 hover:border-line active:scale-95 transition disabled:opacity-50"
              >
                <div className={`w-11 h-11 rounded-xl ${card.tint} flex items-center justify-center`}>
                  <i className={`ti ${card.icon} text-2xl ${card.color}`} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-body font-medium text-fg-strong">{card.title}</p>
                  <p className="text-caption text-fg-faint mt-0.5">{card.description}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setGuestMode(false)}
            className="text-body text-fg-faint hover:text-fg transition text-center"
          >
            ← 돌아가기
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-[fadeUp_0.5s_ease_both]">

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-card border border-line-soft flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
            <i className="ti ti-seeding text-3xl text-fg-muted" aria-hidden="true" />
          </div>
          <div>
            <p className="text-body text-fg-faint mb-1.5">나누리 청년부</p>
            <h1 className="text-display font-medium text-fg-strong mb-2.5 leading-snug">
              우리들의 작은<br />커뮤니티 공간
            </h1>
            <p className="text-body text-fg-faint leading-relaxed">
              비용 청구부터 설문, 찬양팀 일정까지<br />나누리 활동에 필요한 것들을 모았어요
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => navigate("/member/login")}
            className="w-full py-3.5 px-4 rounded-xl bg-inverse text-emphasis font-medium text-white hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <i className="ti ti-user text-base" aria-hidden="true" />
            나누리 멤버입니다
          </button>
          <button
            onClick={() => setGuestMode(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-card border border-line text-emphasis font-medium text-fg hover:bg-surface transition flex items-center justify-center gap-2"
          >
            <i className="ti ti-user-question text-base" aria-hidden="true" />
            외부 방문자입니다
          </button>
        </div>

        <p className="text-caption text-fg-faint">나누리 회계팀</p>

      </div>
    </div>
  );
}
