import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}
        onHome={() => navigate("/home")}
        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-6">

        <div>
          <h1 className="text-lg font-medium text-gray-800">설문 작성</h1>
          <p className="text-sm text-gray-400 mt-1">항목을 추가하고 방식을 설정하세요</p>
        </div>

        {/* 제목 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-500">설문 제목</label>
          <input
            type="text"
            placeholder="예: 5월 수련회 장소 만족도"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
          />
        </div>

        {/* 항목 */}
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-medium text-gray-500">설문 항목</label>

          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <i className="ti ti-grip-vertical text-gray-300 text-base" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="항목 이름 입력"
                  value={item.label}
                  onChange={(e) => updateLabel(item.id, e.target.value)}
                  className="flex-1 text-sm text-gray-800 bg-transparent border-none outline-none placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-gray-300 hover:text-red-400 transition"
                  aria-label="항목 삭제"
                >
                  <i className="ti ti-trash text-base" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {item.isStar ? "별점" : "텍스트 피드백"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleType(item.id)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${item.isStar ? "bg-blue-400" : "bg-gray-200"}`}
                  aria-label="유형 전환"
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${item.isStar ? "right-0.5" : "left-0.5"}`}
                  />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
          >
            <i className="ti ti-plus text-base" aria-hidden="true" />
            항목 추가
          </button>
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <Button onClick={handleSave} loading={saving} disabled={!title || items.every((i) => !i.label)}>
          저장
        </Button>

      </div>
    </div>
  );
}
