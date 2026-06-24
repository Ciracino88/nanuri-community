import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import Button from "../../components/ui/Button";
import ImageCarousel from "../../components/ui/ImageCarousel";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { fetchList } from "../../lib/supabaseList";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { extractMenusFromImage, type MenuItem } from "../../lib/extractMenus";

interface Candidate {
  id: string;
  name: string;
  image_urls: string[];
  menus: MenuItem[];
  created_at: string;
}

export default function VoteListPage() {
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();

  const queryClient = useQueryClient();
  const { data: candidates = [], isLoading: loading } = useQuery({
    queryKey: ["vote_candidates"],
    queryFn: () => fetchList<Candidate>("vote_candidates"),
  });
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentPreview, setCurrentPreview] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vote_candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vote_candidates"] }),
    onError: () => toast.error("삭제에 실패했어요"),
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files];
    const newPreviews = [...imagePreviews, ...files.map((f) => URL.createObjectURL(f))];
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setCurrentPreview(newPreviews.length - 1);
    setMenus([]);
    setExtracting(true);
    try {
      const extracted = await extractMenusFromImage(newFiles);
      setMenus(extracted);
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setCurrentPreview(Math.min(currentPreview, newPreviews.length - 1));
    setMenus([]);
  };

  const resetForm = () => {
    setName("");
    setImageFiles([]);
    setImagePreviews([]);
    setCurrentPreview(0);
    setMenus([]);
    if (fileRef.current) fileRef.current.value = "";
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const imageUrls = await Promise.all(imageFiles.map((f) => uploadReceipt(f, "votes")));
      const { error } = await supabase.from("vote_candidates").insert({
        name: name.trim(),
        image_urls: imageUrls,
        menus,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vote_candidates"] });
      resetForm();
    },
    onError: () => toast.error("저장에 실패했어요"),
  });

  const handleSave = () => {
    if (!name.trim()) return;
    saveMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}
        onProfileEdit={() => navigate("/member/setup")}
      />

      <PageContainer width="default">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading font-medium text-fg-strong">메뉴 종합</h1>
            <p className="text-body text-fg-faint mt-0.5">메뉴판 이미지를 올리고 메뉴를 종합받으세요</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-body text-info font-medium"
          >
            <i className="ti ti-upload text-emphasis" aria-hidden="true" />
            메뉴판 업로드
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center" onClick={() => { if (!extracting && !saveMutation.isPending) resetForm(); }}>
            <div
              className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-emphasis font-medium text-fg-strong">메뉴판 업로드</h2>
                <button onClick={() => { if (!extracting && !saveMutation.isPending) resetForm(); }} disabled={extracting || saveMutation.isPending} className="text-fg-faint hover:text-fg transition disabled:opacity-30">
                  <i className="ti ti-x text-heading" aria-hidden="true" />
                </button>
              </div>

              <input
                type="text"
                placeholder="제목을 입력해주세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 text-body border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-info-soft focus:border-info transition"
              />

              {imagePreviews.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <ImageCarousel
                    images={imagePreviews}
                    currentIndex={currentPreview}
                    onIndexChange={setCurrentPreview}
                    onRemove={extracting ? undefined : removeImage}
                  />
                  <label className="flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-line rounded-xl text-body text-fg-faint cursor-pointer hover:bg-surface transition">
                    <i className="ti ti-plus text-emphasis" aria-hidden="true" />
                    사진 추가
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1.5 py-8 bg-surface border border-dashed border-line rounded-xl cursor-pointer hover:bg-sunken transition">
                  <i className="ti ti-camera text-title text-fg-faint" aria-hidden="true" />
                  <p className="text-body text-fg-faint">메뉴판 사진 업로드</p>
                  <p className="text-caption text-fg-faint">여러 장 선택 가능</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              )}

              {extracting && <LoadingSpinner label="이미지에서 메뉴를 추출하고 있어요" />}
              {!extracting && menus.length > 0 && <p className="text-caption text-success">메뉴 {menus.length}개 추출 완료</p>}

              <Button onClick={handleSave} loading={saveMutation.isPending} disabled={!name.trim() || extracting}>
                저장
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : candidates.length === 0 ? (
          <p className="text-body text-fg-faint text-center py-10">아직 등록된 메뉴판이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {candidates.map((c) => (
              <div key={c.id} className="bg-card border border-line-soft rounded-xl overflow-hidden">
                {c.image_urls?.length > 0 && (
                  <img src={c.image_urls[0]} alt={c.name} className="w-full h-36 object-cover" />
                )}
                <div className="p-4 flex items-center justify-between">
                  <button onClick={() => navigate(`/vote/candidate/${c.id}`)} className="flex-1 text-left">
                    <p className="text-body font-medium text-fg-strong">{c.name}</p>
                    <p className="text-caption text-fg-faint mt-0.5">메뉴 {c.menus.length}개 · 사진 {c.image_urls?.length ?? 0}장</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!confirm(`"${c.name}"을 삭제할까요?`)) return;
                        deleteMutation.mutate(c.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-fg-faint hover:text-danger transition p-1 disabled:opacity-40"
                    >
                      <i className="ti ti-trash text-emphasis" aria-hidden="true" />
                    </button>
                    <i className="ti ti-chevron-right text-fg-faint text-heading" aria-hidden="true" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </PageContainer>
    </div>
  );
}
