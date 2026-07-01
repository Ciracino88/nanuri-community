/** Cloudflare Worker 경유로 R2에 올라간 이미지를 삭제 */
export async function deleteImage(imageUrl: string): Promise<void> {
  await fetch(`${import.meta.env.VITE_CF_WORKER_URL}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiptUrl: imageUrl }),
  });
}
