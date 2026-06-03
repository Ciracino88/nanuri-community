// src/lib/uploadReceipt.ts
export async function uploadReceipt(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${import.meta.env.VITE_CF_WORKER_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("영수증 업로드 실패");
  const { url } = await res.json();
  return url;
}