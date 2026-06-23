import { useEffect, useMemo, useRef, useState } from "react";
import Lightbox from "../../components/ui/Lightbox";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import ImageCarousel from "../../components/ui/ImageCarousel";
import SuccessScreen from "../../components/SuccessScreen";
import LoadingScreen from "../../components/LoadingScreen";
import { useAuthStore } from "../../store/authStore";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { supabase } from "../../lib/supabase";
import { generateNickname } from "../../lib/generateNickname";
import type { MenuItem } from "../../lib/extractMenus";

interface Candidate {
  id: string;
  name: string;
  image_urls: string[];
  menus: MenuItem[];
}

interface SelectedItem {
  name: string;
  option?: string;
}

interface VoteResponse {
  id: string;
  nickname: string;
  selected_menus: SelectedItem[];
}

export default function VoteResponsePage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [query, setQuery] = useState("");
  const [pendingMenu, setPendingMenu] = useState<MenuItem | null>(null);
  const { submitting, success: submitted, submit } = useFormSubmit();
  const [responses, setResponses] = useState<VoteResponse[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!candidateId) return;

    supabase.from("vote_candidates").select("*").eq("id", candidateId).single()
      .then(({ data }) => setCandidate(data));

    supabase.from("vote_responses").select("id, nickname, selected_menus").eq("candidate_id", candidateId)
      .then(({ data }) => setResponses(data ?? []));

    const channel = supabase
      .channel(`vote_responses:${candidateId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "vote_responses",
        filter: `candidate_id=eq.${candidateId}`,
      }, ({ eventType, new: newRow, old: oldRow }) => {
        if (eventType === "INSERT") {
          setResponses((prev) => [...prev, newRow as VoteResponse]);
        } else if (eventType === "DELETE") {
          setResponses((prev) => prev.filter((r) => r.id !== (oldRow as VoteResponse).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [candidateId]);

  const sortedMenuCounts = useMemo(() => {
    const counts = responses.reduce<Record<string, { count: number; names: string[] }>>((acc, r) => {
      r.selected_menus.forEach((item) => {
        const key = item.option ? `${item.name} (${item.option})` : item.name;
        if (!acc[key]) acc[key] = { count: 0, names: [] };
        acc[key].count += 1;
        acc[key].names.push(r.nickname ?? "익명");
      });
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
  }, [responses]);

  const selectedNames = useMemo(() => selected.map((s) => s.name), [selected]);

  const filtered = useMemo(() =>
    candidate?.menus.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) && !selectedNames.includes(m.name)
    ) ?? [],
    [candidate, query, selectedNames]
  );

  const handleSelectMenu = (menu: MenuItem) => {
    if (menu.options && menu.options.length > 0) {
      setPendingMenu(menu);
      setQuery("");
    } else {
      setSelected((prev) => [...prev, { name: menu.name }]);
      setQuery("");
      inputRef.current?.focus();
    }
  };

  const handleSelectOption = (option: string) => {
    if (!pendingMenu) return;
    setSelected((prev) => [...prev, { name: pendingMenu.name, option }]);
    setPendingMenu(null);
    inputRef.current?.focus();
  };

  const removeMenu = (name: string) => {
    setSelected((prev) => prev.filter((m) => m.name !== name));
  };

  const handleSubmit = async () => {
    if (!candidateId || selected.length === 0) return;
    await submit(async () => {
      const nickname = generateNickname();
      const { error } = await supabase.from("vote_responses").insert({
        candidate_id: candidateId,
        nickname,
        selected_menus: selected,
      });
      if (error) throw error;
    });
  };

  const navbarProps = {
    userName: userProfile?.name,
    onLogout: signOut,
    onProfileEdit: () => navigate("/member/setup"),
  };

  if (!candidate) {
    return <LoadingScreen />;
  }

  if (submitted) {
    return (
      <SuccessScreen
        emoji="🎉"
        message="메뉴 선택 완료!"
        buttonText="목록으로 돌아가기"
        onButtonClick={() => navigate("/vote")}
        navbarProps={navbarProps}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar {...navbarProps} />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-5">

        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/vote")} className="text-gray-300 hover:text-gray-500 transition">
            <i className="ti ti-arrow-left text-lg" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-medium text-gray-800">{candidate.name}</h1>
        </div>

        {candidate.image_urls?.length > 0 && (
          <div className="relative">
            <ImageCarousel
              images={candidate.image_urls}
              currentIndex={currentImage}
              onIndexChange={setCurrentImage}
            />
            <Lightbox images={candidate.image_urls} initialIndex={currentImage} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-500">메뉴 선택</label>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((item) => (
                <span
                  key={item.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg"
                >
                  {item.name}{item.option && ` (${item.option})`}
                  <button onClick={() => removeMenu(item.name)} className="text-blue-400 hover:text-blue-600">
                    <i className="ti ti-x text-xs" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {pendingMenu ? (
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">{pendingMenu.name} — 옵션 선택</p>
              <div className="flex flex-wrap gap-2">
                {pendingMenu.options?.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleSelectOption(opt.label)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    {opt.label}{opt.price && <span className="text-xs text-gray-400 ml-1">{opt.price}</span>}
                  </button>
                ))}
                <button
                  onClick={() => { setSelected((prev) => [...prev, { name: pendingMenu.name }]); setPendingMenu(null); }}
                  className="px-3 py-1.5 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition"
                >
                  옵션 없음
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={candidate.menus.length > 0 ? "메뉴 검색..." : "메뉴 정보가 없습니다"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={candidate.menus.length === 0}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
              />
              {query && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden z-10">
                  {filtered.slice(0, 8).map((m) => (
                    <button
                      key={m.name}
                      onClick={() => handleSelectMenu(m)}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{m.name}</span>
                      <div className="flex items-center gap-2">
                        {m.options && m.options.length > 0 && (
                          <span className="text-xs text-blue-400">{m.options.map((o) => o.label).join(" / ")}</span>
                        )}
                        {m.price && <span className="text-xs text-gray-400">{m.price}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {query && filtered.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-300">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} loading={submitting} disabled={selected.length === 0}>
          선택 완료
        </Button>

        {sortedMenuCounts.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">현재 메뉴 현황</p>
              <p className="text-xs text-gray-400">{responses.length}명 참여</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
              {sortedMenuCounts.map(([menuName, { count, names }]) => (
                <div key={menuName} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{menuName}</p>
                    <p className="text-xs text-gray-400 truncate">{names.join(", ")}</p>
                  </div>
                  <span className="text-sm font-medium text-blue-500 shrink-0">{count}명</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
