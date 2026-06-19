export interface PlaceInfo {
  address: string;
  roadAddress: string;
  buildingName: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceInfo | null> {
  const workerUrl = import.meta.env.VITE_CF_WORKER_URL;
  const res = await fetch(`${workerUrl}/geocode?lat=${lat}&lng=${lng}`);

  if (!res.ok) throw new Error("위치 변환 요청 실패");

  return await res.json();
}
