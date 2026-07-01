import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageContainer from "../../components/PageContainer";
import Input from "../../components/ui/Input";
import { useReceiptUpload } from "../../hooks/useReceiptUpload";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { supabase } from "../../lib/supabase";

interface FormValues {
  title: string;
  eventDate: string;
  startTime: string;
  placeName: string;
}

export default function EventBuilderPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();
  const { receiptFile: posterFile, receiptPreview: posterPreview, handleReceiptChange: handlePoster, reset: resetPoster } = useReceiptUpload();

  const onSubmit = async (values: FormValues) => {
    try {
      let imageUrl: string | null = null;
      if (posterFile) imageUrl = await uploadReceipt(posterFile, "events");

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          title: values.title.trim(),
          event_date: values.eventDate,
          start_time: values.startTime,
          place_name: values.placeName.trim() || null,
          image_url: imageUrl,
          status: "upcoming",
        })
        .select("id")
        .single();
      if (error) throw error;

      toast.success("행사를 만들었어요. 순서를 추가하세요");
      navigate(`/admin/events/${event.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했어요");
    }
  };

  return (
    <PageContainer width="default">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/events")} className="text-fg-faint hover:text-fg-muted transition" aria-label="뒤로">
          <i className="ti ti-arrow-left text-heading" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-heading font-medium text-fg-strong">행사 만들기</h1>
          <p className="text-body text-fg-faint mt-0.5">먼저 기본 정보만 입력하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Input
            label="행사 이름"
            placeholder="예: 여름 수련회"
            error={errors.title?.message}
            {...register("title", { required: "행사 이름을 입력해주세요" })}
          />
          <Input
            label="날짜"
            type="date"
            error={errors.eventDate?.message}
            {...register("eventDate", { required: "날짜를 선택해주세요" })}
          />
          <Input
            label="모이는 시각"
            type="time"
            error={errors.startTime?.message}
            {...register("startTime", { required: "모이는 시각을 선택해주세요" })}
          />
          <Input label="장소 (선택)" placeholder="예: 양평 수련원" {...register("placeName")} />

          <div className="flex flex-col gap-1.5">
            <label className="text-body font-medium text-fg-muted">포스터 (선택)</label>
            {posterPreview ? (
              <div className="relative">
                <label className="block cursor-pointer">
                  <img src={posterPreview} alt="포스터 미리보기" className="w-full h-auto rounded-xl border border-line-soft" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePoster(file);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={resetPoster}
                  aria-label="포스터 삭제"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full text-white flex items-center justify-center active:scale-90 transition"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                >
                  <i className="ti ti-x text-emphasis" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-line rounded-lg cursor-pointer hover:bg-surface transition">
                <span className="text-display text-fg-faint">📎</span>
                <p className="text-body text-fg-faint">클릭해서 업로드</p>
                <p className="text-caption text-fg-faint">JPG, PNG 지원</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePoster(file);
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="bg-purple-subtle border border-purple/15 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <i className="ti ti-info-circle text-purple text-emphasis shrink-0" aria-hidden="true" />
          <p className="text-caption text-purple">저장하면 순서(프로그램)를 추가하는 화면으로 넘어가요</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-lg text-emphasis font-medium bg-purple text-white transition hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "처리 중..." : "저장하고 순서 추가"}
        </button>
      </form>

    </PageContainer>
  );
}
