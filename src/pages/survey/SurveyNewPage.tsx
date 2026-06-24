import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

interface SurveyItem {
  id: string;
  label: string;
  isStar: boolean;
}

export default function SurveyNewPage() {
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<SurveyItem[]>([
    { id: crypto.randomUUID(), label: "", isStar: true },
  ]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: "", isStar: true }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLabel = (id: string, label: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, label } : item));
  };

  const toggleType = (id: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, isStar: !item.isStar } : item));
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from("survey_templates").insert({
        title,
        items: items.map(({ label, isStar }) => ({ label, isStar })),
      });
      if (error) throw error;
      navigate("/admin/surveys");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}

        onProfileEdit={() => navigate("/member/setup")}
      />

      <PageContainer width="default">

        <div>
          <h1 className="text-heading font-medium text-fg-strong">설문 작성</h1>
          <p className="text-body text-fg-faint mt-1">항목을 추가하고 방식을 설정하세요</p>
        </div>

        {/* 제목 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-body font-medium text-fg-muted">설문 제목</label>
          <input
            type="text"
            placeholder="예: 5월 수련회 장소 만족도"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 text-body border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-info-soft focus:border-info transition"
          />
        </div>

        {/* 항목 */}
        <div className="flex flex-col gap-2.5">
          <label className="text-body font-medium text-fg-muted">설문 항목</label>

          {items.map((item) => (
            <div key={item.id} className="bg-card border border-line-soft rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <i className="ti ti-grip-vertical text-fg-faint text-emphasis" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="항목 이름 입력"
                  value={item.label}
                  onChange={(e) => updateLabel(item.id, e.target.value)}
                  className="flex-1 text-body text-fg-strong bg-transparent border-none outline-none placeholder-fg-faint"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-fg-faint hover:text-danger transition"
                  aria-label="항목 삭제"
                >
                  <i className="ti ti-trash text-emphasis" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line-soft">
                <span className="text-caption text-fg-faint">
                  {item.isStar ? "만족도" : "텍스트 피드백"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleType(item.id)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${item.isStar ? "bg-info" : "bg-sunken"}`}
                  aria-label="유형 전환"
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-card rounded-full shadow-sm transition-all ${item.isStar ? "right-0.5" : "left-0.5"}`}
                  />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full py-2.5 border border-dashed border-line rounded-xl text-body text-fg-faint hover:bg-surface transition flex items-center justify-center gap-1.5"
          >
            <i className="ti ti-plus text-emphasis" aria-hidden="true" />
            항목 추가
          </button>
        </div>

        {error && <p className="text-caption text-danger text-center">{error}</p>}
        <Button onClick={handleSave} loading={saving} disabled={!title || items.every((i) => !i.label)}>
          저장
        </Button>

      </PageContainer>
    </div>
  );
}
