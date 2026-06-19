import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { extractGpsFromImage } from "../../lib/extractGps";
import { reverseGeocode } from "../../lib/reverseGeocode";

interface Template {
  id: string;
  title: string;
  items: { label: string; isStar: boolean }[];
}

export default function SurveyDeployPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();

  const [template, setTemplate] = useState<Template | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [extractingGps, setExtractingGps] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("survey_templates").select("*").eq("id", id).single()
      .then(({ data }) => setTemplate(data));
  }, [id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setPlaceName(null);
    setExtractingGps(true);

    try {
      const gps = await extractGpsFromImage(file);
      if (gps) {
        const place = await reverseGeocode(gps.latitude, gps.longitude);
        if (place) setPlaceName(place.buildingName || place.roadAddress || place.address);
      }
    } finally {
      setExtractingGps(false);
    }
  };

  const handleDeploy = async () => {
    if (!template) return;
    setDeploying(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadReceipt(imageFile, "surveys");
      }

      const { error } = await supabase.from("surveys").insert({
        template_id: template.id,
        title: template.title,
        items: template.items,
        image_url: imageUrl,
        place_name: placeName,
        status: "active",
      });
      if (error) throw error;
      navigate("/admin/surveys");
    } catch (err) {
      setError(err instanceof Error ? err.message : "배포에 실패했습니다");
    } finally {
      setDeploying(false);
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-300">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}
        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/surveys")}
            className="text-gray-300 hover:text-gray-500 transition"
          >
            <i className="ti ti-arrow-left text-lg" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-medium text-gray-800">설문 배포</h1>
            <p className="text-sm text-gray-400 mt-0.5">{template.title}</p>
          </div>
        </div>

        {/* 사진 업로드 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-500">장소 사진</label>
          {imagePreview ? (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden">
              <img src={imagePreview} alt="장소 사진" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); setPlaceName(null); }}
                className="absolute top-2 right-2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/60 transition"
              >
                <i className="ti ti-x text-sm" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1.5 py-5 bg-white border border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <i className="ti ti-camera text-xl text-gray-300" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-400">사진 업로드</p>
              <p className="text-xs text-gray-300">GPS 정보가 포함된 사진 권장</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}

          {extractingGps && (
            <p className="text-xs text-blue-400">위치 정보 추출 중...</p>
          )}
          {placeName && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-lg">
              <i className="ti ti-map-pin text-sm text-blue-400" aria-hidden="true" />
              <p className="text-xs text-blue-600">{placeName}</p>
            </div>
          )}
          {!extractingGps && imageFile && !placeName && (
            <p className="text-xs text-gray-300">GPS 정보가 없는 사진입니다</p>
          )}
        </div>

        {/* 항목 미리보기 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-500">설문 항목 미리보기</label>
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
            {template.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-md ${item.isStar ? "bg-blue-50 text-blue-400" : "bg-gray-100 text-gray-400"}`}>
                  {item.isStar ? "감정 선택" : "텍스트"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <Button onClick={handleDeploy} loading={deploying}>
          <i className="ti ti-send text-sm mr-1.5" aria-hidden="true" />
          배포하기
        </Button>

      </div>
    </div>
  );
}
