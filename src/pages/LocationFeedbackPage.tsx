import { useState } from "react";
import { useForm } from "react-hook-form";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import { extractGpsFromImage } from "../lib/extractGps";
import { reverseGeocode } from "../lib/reverseGeocode";
import type { PlaceInfo } from "../lib/reverseGeocode";

interface FeedbackFormValues {
  overallRating: number;
  accessibility: number;
  cleanliness: number;
  service: number;
  comment: string;
}

const RATING_LABELS = ["", "매우 불만족", "불만족", "보통", "만족", "매우 만족"];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition ${
            star <= (hovered || value) ? "text-yellow-400" : "text-gray-200"
          }`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
      {(hovered || value) > 0 && (
        <span className="text-sm text-gray-400 self-center ml-1">
          {RATING_LABELS[hovered || value]}
        </span>
      )}
    </div>
  );
}

export default function LocationFeedbackPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { handleSubmit, setValue, watch } = useForm<FeedbackFormValues>({
    defaultValues: {
      overallRating: 0,
      accessibility: 0,
      cleanliness: 0,
      service: 0,
      comment: "",
    },
  });

  const ratings = watch();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setPlace(null);
    setLocationError(null);
    setLoadingLocation(true);

    try {
      const gps = await extractGpsFromImage(file);
      if (!gps) {
        setLocationError("이미지에서 위치 정보를 찾을 수 없습니다. GPS가 활성화된 상태로 촬영한 사진을 사용해주세요.");
        return;
      }
      setCoords({ lat: gps.latitude, lng: gps.longitude });
      const placeInfo = await reverseGeocode(gps.latitude, gps.longitude);
      if (!placeInfo) {
        setLocationError("위치 정보를 주소로 변환하지 못했습니다.");
        return;
      }
      setPlace(placeInfo);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "위치 정보 추출에 실패했습니다.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const onSubmit = (values: FeedbackFormValues) => {
    if (!place) return;
    // TODO: Supabase에 저장
    console.log("피드백 제출:", { place, ...values });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-semibold text-gray-700">피드백이 제출되었습니다</h2>
          <p className="text-sm text-gray-400 text-center">소중한 의견 감사합니다.</p>
          <Button type="button" onClick={() => { setSubmitted(false); setImagePreview(null); setPlace(null); }}>
            다른 장소 평가하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-lg mx-auto w-full p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">장소 위치 피드백</h1>
          <p className="text-sm text-gray-400 mt-1">사진을 업로드하면 촬영 위치가 자동으로 추출됩니다</p>
        </div>

        {/* 이미지 업로드 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">사진 업로드</label>
          <label className={`relative w-full aspect-square rounded-lg cursor-pointer overflow-hidden block
            ${imagePreview ? "" : "border-2 border-dashed border-gray-200 hover:bg-gray-50 transition"}`}>
            {imagePreview ? (
              <img src={imagePreview} alt="업로드 사진" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                <span className="text-2xl text-gray-300">📍</span>
                <p className="text-sm text-gray-400">클릭해서 사진 업로드</p>
                <p className="text-xs text-gray-300">GPS 정보가 포함된 JPG 권장</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>

        {/* 위치 정보 */}
        {loadingLocation && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-500 text-center">
            위치 정보를 불러오는 중...
          </div>
        )}

        {locationError && (
          <div className="bg-red-50 rounded-lg p-4 text-sm text-red-500">
            {locationError}
          </div>
        )}

        {place && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col gap-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">추출된 위치</p>
            {place.buildingName && (
              <p className="text-base font-semibold text-gray-800">{place.buildingName}</p>
            )}
            {place.roadAddress && (
              <p className="text-sm text-gray-600">{place.roadAddress}</p>
            )}
            {place.address && (
              <p className="text-xs text-gray-400">{place.address}</p>
            )}
            {coords && (
              <a
                href={`https://map.kakao.com/link/map/${encodeURIComponent(place.buildingName || place.roadAddress || place.address)},${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-blue-500 hover:underline self-start"
              >
                카카오맵에서 보기 →
              </a>
            )}
          </div>
        )}

        {/* 피드백 폼 */}
        {place && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <hr className="border-gray-100" />

            {[
              { key: "overallRating" as const, label: "전반적인 만족도" },
              { key: "accessibility" as const, label: "접근성 (교통·주차)" },
              { key: "cleanliness" as const, label: "청결도" },
              { key: "service" as const, label: "서비스·응대" },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600">{label}</label>
                <StarRating
                  value={ratings[key] as number}
                  onChange={(v) => setValue(key, v)}
                />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600">추가 의견 (선택)</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
                rows={4}
                placeholder="이 장소에 대한 의견을 자유롭게 작성해주세요"
                onChange={(e) => setValue("comment", e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={ratings.overallRating === 0}
            >
              피드백 제출
            </Button>
            {ratings.overallRating === 0 && (
              <p className="text-xs text-gray-400 text-center -mt-3">전반적인 만족도를 선택해주세요</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
