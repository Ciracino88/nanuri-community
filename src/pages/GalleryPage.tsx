import PageContainer from "../components/PageContainer";

export default function GalleryPage() {
  return (
    <PageContainer width="default">
      <div
        className="flex flex-col items-center justify-center text-center gap-4 py-20"
        style={{ animation: "cardEnter 0.4s ease both" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-subtle flex items-center justify-center">
          <i className="ti ti-photo text-4xl text-purple" aria-hidden="true" />
        </div>
        <div>
          <p className="text-title font-medium text-fg-strong">갤러리</p>
          <p className="text-body text-fg-faint mt-1">곧 사진을 모아볼 수 있어요</p>
        </div>
        <span className="text-caption text-fg-faint bg-card border border-line-soft rounded-full px-3 py-1">
          준비 중
        </span>
      </div>
    </PageContainer>
  );
}
