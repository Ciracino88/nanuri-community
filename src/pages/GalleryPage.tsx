import LoadingSpinner from "../components/LoadingSpinner";
import { TAB_COLORS } from "../constants/theme";

export default function GalleryPage() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#0f1117" }}>
      <LoadingSpinner label="사진 불러오는 중..." size="lg" color={TAB_COLORS.gallery} />
    </div>
  );
}
