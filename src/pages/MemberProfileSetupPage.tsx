import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useRef, useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import PageContainer from "../components/PageContainer";
import BankSelector from "../components/BankSelector";
import { uploadReceipt } from "../lib/uploadReceipt";
import { POSITIONS } from "../constants/worship";

interface FormValues {
  name: string;
  bank_name: string;
  account_number: string;
  phone: string;
}

export default function MemberProfileSetupPage() {
  const navigate = useNavigate();
  const { user, userProfile, fetchUserProfile, signOut } = useAuthStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: userProfile?.name ?? "",
      bank_name: userProfile?.bank_name ?? "",
      account_number: userProfile?.account_number ?? "",
      phone: userProfile?.phone ?? "",
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState<string[]>(userProfile?.position ?? []);
  const [team, setTeam] = useState<string>(userProfile?.team ?? "나누리");
  const hasOptionalData = !!(
    (userProfile?.position?.length) ||
    userProfile?.bank_name ||
    userProfile?.account_number ||
    userProfile?.phone
  );
  const [showOptional, setShowOptional] = useState(hasOptionalData);
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

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      name: values.name,
      team,
      position: positions.length > 0 ? positions : null,
      bank_name: values.bank_name || null,
      account_number: values.account_number || null,
      phone: values.phone || null,
      avatar_url,
    });

    if (error) {
      console.error("[MemberProfileSetupPage] upsert error:", error);
      setSubmitting(false);
      return;
    }

    await fetchUserProfile().catch(() => {});
    setSubmitting(false);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageContainer width="narrow">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-body text-fg-faint hover:text-fg transition mb-4"
        >
          <i className="ti ti-chevron-left text-emphasis" aria-hidden="true" />
          뒤로
        </button>
        <h1 className="text-title font-medium text-fg-strong">프로필 설정</h1>
        <p className="text-body text-fg-faint mt-1">내 정보를 등록하고 수정할 수 있어요</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* 필수 입력 */}
        <div className="flex flex-col gap-5">

          {/* 프로필 사진 */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-sunken border border-line hover:opacity-80 transition"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <i className="ti ti-user text-3xl text-fg-faint absolute inset-0 flex items-center justify-center" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true" />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <i className="ti ti-camera text-white text-heading" aria-hidden="true" />
              </div>
            </button>
            <p className="text-caption text-fg-faint">프로필 사진</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* 이름 */}
          <Input
            label="이름"
            placeholder="홍길동"
            error={errors.name?.message}
            {...register("name", { required: "이름을 입력해주세요" })}
          />

          {/* 팀 */}
          <div className="flex flex-col gap-1.5">
            <p className="text-body font-medium text-fg">팀</p>
            <div className="flex gap-2">
              {["나누리", "섬김이"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTeam(t)}
                  className={`px-4 py-1.5 rounded-full text-body border transition ${
                    team === t
                      ? "bg-inverse text-white border-inverse"
                      : "bg-card text-fg border-line hover:border-line-strong"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 선택 입력 토글 */}
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center justify-between w-full px-4 py-3 bg-surface rounded-xl border border-line-soft hover:bg-sunken transition"
        >
          <span className="text-body text-fg-muted">추가 정보 입력</span>
          <i className={`ti ${showOptional ? "ti-chevron-up" : "ti-chevron-down"} text-fg-faint`} aria-hidden="true" />
        </button>

        {/* 선택 입력 */}
        {showOptional && <div className="flex flex-col gap-5 animate-[fadeIn_0.2s_ease]">

          {/* 포지션 */}
          <div className="flex flex-col gap-1.5">
            <p className="text-body font-medium text-fg">포지션</p>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPositions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                  className={`px-3 py-1.5 rounded-lg text-body border transition ${
                    positions.includes(p)
                      ? "bg-inverse text-white border-inverse"
                      : "bg-card text-fg border-line hover:border-line-strong"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 은행 및 계좌 */}
          <div className="flex flex-col gap-1.5">
            <BankSelector
              value={watch("bank_name")}
              onChange={(bank: string) => setValue("bank_name", bank)}
            />
            <input type="hidden" {...register("bank_name")} />
          </div>

          <Input
            label="계좌번호"
            placeholder="계좌번호를 입력하세요"
            inputMode="numeric"
            {...register("account_number")}
          />

          {/* 연락처 */}
          <Input
            label="연락처"
            placeholder="010-0000-0000"
            inputMode="tel"
            {...register("phone")}
          />
        </div>}

        <Button type="submit" loading={submitting}>
          저장하기
        </Button>
      </form>

      <button
        type="button"
        onClick={async () => { await signOut(); navigate("/"); }}
        className="mt-2 mx-auto flex items-center gap-1.5 text-body text-fg-faint hover:text-danger transition"
      >
        <i className="ti ti-logout text-emphasis" aria-hidden="true" />
        로그아웃
      </button>
      </PageContainer>
    </div>
  );
}
