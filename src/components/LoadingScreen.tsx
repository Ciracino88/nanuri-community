import LoadingSpinner from "./LoadingSpinner";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner label="불러오는 중..." size="lg" />
    </div>
  );
}
