import { Settings, Receipt, BookText } from "lucide-react";
import toast from "react-hot-toast";
import ActionRow from "../../components/ui/ActionRow";
import { ACCENT } from "../../constants/theme";

// 행사 관리는 행사 기능과 함께 제거됐다(docs/status.md). 지금 관리자에 남은 건 재정 관리
// 뿐이고 그마저 준비 중 플레이스홀더다. 진입로도 아직 없다(내정보에서 붙일 계획).
function FinanceAdminSection() {
  const soon = () => toast("준비 중인 기능이에요", { icon: "🚧" });
  return (
    <div className="px-4 pt-1 pb-24 flex flex-col gap-2.5">
      <ActionRow Icon={Receipt} label="청구 내역 관리" desc="청구·정산 내역을 관리해요" badge="준비 중" onClick={soon} />
      <ActionRow Icon={BookText} label="회계 장부 관리" desc="월별 수입·지출 장부" onClick={soon} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: "#0f1117" }}>
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-black" style={{ color: "#f0f2f8" }}>관리자</h1>
        <div className="flex items-center justify-center rounded-xl" style={{ width: 32, height: 32, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}>
          <Settings size={15} color={ACCENT} />
        </div>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto">
        <FinanceAdminSection />
      </div>
    </div>
  );
}
