// src/lib/uploadReceipt.ts
import imageCompression from "browser-image-compression";

export async function uploadReceipt(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    exifOrientation: -1, // EXIF 회전 자동 보정
  });

  const formData = new FormData();
  formData.append("file", compressed);
  const res = await fetch(`${import.meta.env.VITE_CF_WORKER_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("영수증 업로드 실패");
  const { url } = await res.json();
  return url;
}