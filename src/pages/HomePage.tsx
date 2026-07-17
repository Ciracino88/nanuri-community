import { useNavigate } from "react-router-dom";
import { Bell, Plus, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import ActionRow from "../components/ui/ActionRow";
import Button from "../components/ui/Button";
import { PAGE_BOTTOM_PAD } from "../constants/layout";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col">
      <div className="pb-6" style={{ paddingBottom: PAGE_BOTTOM_PAD }}>

        {/* 헤더 */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-title font-bold text-fg-strong">나누리</h1>
          <button
            onClick={() => toast("준비 중이에요", { icon: "🔔" })}
            className="w-10 h-10 rounded-tile bg-card shadow-card flex items-center justify-center active:scale-95 transition"
            aria-label="알림"
          >
            <Bell size={20} className="text-fg-muted" />
          </button>
        </div>

        {/* 빠른 메뉴 */}
        <div className="px-5 mb-6">
          <h3 className="text-body font-semibold text-fg-muted mb-2.5">빠른 메뉴</h3>
          <div className="flex flex-col gap-2.5">
            <ActionRow
              Icon={Receipt}
              label="비용 청구"
              desc="영수증 올리고 청구서 작성"
              onClick={() => navigate("/member/bill")}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="px-5">
          <Button onClick={() => navigate("/member/bill")} className="active:scale-[0.99]">
            <span className="flex items-center justify-center gap-2">
              <Plus size={20} strokeWidth={2.5} />
              새 비용 청구서 작성
            </span>
          </Button>
        </div>

      </div>
    </div>
  );
}
