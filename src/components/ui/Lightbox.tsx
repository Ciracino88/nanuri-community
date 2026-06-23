import { useState } from "react";
import ImageCarousel from "./ImageCarousel";

interface LightboxProps {
  images: string[];
  initialIndex?: number;
}

export default function Lightbox({ images, initialIndex = 0 }: LightboxProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleOpen = () => {
    setCurrentIndex(initialIndex);
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="absolute bottom-2 right-2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/60 transition z-10"
      >
        <i className="ti ti-arrows-maximize text-sm" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageCarousel
              images={images}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              aspectRatio="full"
              objectFit="contain"
            />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/60 transition"
          >
            <i className="ti ti-x text-lg" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
