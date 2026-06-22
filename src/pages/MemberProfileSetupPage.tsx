import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useRef, useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import BankSelector from "../components/BankSelector";
import { uploadReceipt } from "../lib/uploadReceipt";

const POSITIONS = [
  "인도자", "싱어1", "싱어2", "메인 피아노", "세컨 피아노",
  "어쿠스틱", "베이스", "일렉", "드럼", "PPT",
];

interface FormValues {
  name: string;
  bank_name: string;
  account_number: string;
}

export default function MemberProfileSetupPage() {
  const navigate = useNavigate();
  const { user, userProfile, fetchUserProfile } = useAuthStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: userProfile?.name ?? "",
      bank_name: userProfile?.bank_name ?? "",
      account_number: userProfile?.account_number ?? "",
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState<string[]>(userProfile?.position ?? []);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);

    let avatar_url = userProfile?.avatar_url ?? null;
    if (avatarFile) {
      avatar_url = await uploadReceipt(avatarFile, "avatars");
    }

    await supabase.from("user_profiles").upsert({
      id: user.id,
      name: values.name,
      bank_name: values.bank_name,
      account_number: values.account_number,
      position: positions.length > 0 ? positions : null,
      avatar_url,
    });

    await fetchUserProfile();
    setSubmitting(false);
    navigate("/home");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">나누리 청년부</p>
        <h1 className="text-xl font-medium text-gray-800">프로필 설정</h1>
        <p className="text-sm text-gray-400 mt-1">내 정보를 등록하고 수정할 수 있어요</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-80 transition"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <i className="ti ti-user text-3xl text-gray-300 absolute inset-0 flex items-center justify-center" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true" />
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <i className="ti ti-camera text-white text-lg" aria-hidden="true" />
            </div>
          </button>
          <p className="text-xs text-gray-400">프로필 사진</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <Input
          label="이름"
          placeholder="홍길동"
          error={errors.name?.message}
          {...register("name", { required: "이름을 입력해주세요" })}
        />

        {/* 포지션 */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-700">포지션</p>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPositions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  positions.includes(p)
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <BankSelector
            value={watch("bank_name")}
            onChange={(bank: string) => setValue("bank_name", bank, { shouldValidate: true })}
          />
          <input type="hidden" {...register("bank_name", { required: "은행을 선택해주세요" })} />
          {errors.bank_name && <p className="text-xs text-red-500">{errors.bank_name.message}</p>}
        </div>

        <Input
          label="계좌번호"
          placeholder="계좌번호를 입력하세요"
          inputMode="numeric"
          error={errors.account_number?.message}
          {...register("account_number", { required: "계좌번호를 입력해주세요" })}
        />

        <Button type="submit" loading={submitting}>
          저장하기
        </Button>
      </form>
    </div>
  );
}
