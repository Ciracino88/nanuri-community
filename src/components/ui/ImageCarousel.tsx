interface Props {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onRemove?: (index: number) => void;
  aspectRatio?: "video" | "square" | "full";
  objectFit?: "cover" | "contain";
}

export default function ImageCarousel({ images, currentIndex, onIndexChange, onRemove, aspectRatio = "video", objectFit = "cover" }: Props) {
  const aspectClass = aspectRatio === "square" ? "aspect-square" : aspectRatio === "full" ? "h-full" : "aspect-video";

  return (
    <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden`}>
      <img src={images[currentIndex]} alt={`이미지 ${currentIndex + 1}`} className={`w-full h-full ${objectFit === "contain" ? "object-contain" : "object-cover"}`} />

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(currentIndex)}
          className="absolute top-2 right-2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/60 transition"
        >
          <i className="ti ti-x text-sm" aria-hidden="true" />
        </button>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center disabled:opacity-30 hover:bg-black/60 transition"
          >
            <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
          </button>
          <button
            onClick={() => onIndexChange(Math.min(images.length - 1, currentIndex + 1))}
            disabled={currentIndex === images.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center disabled:opacity-30 hover:bg-black/60 transition"
          >
            <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => onIndexChange(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-card" : "bg-card/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
