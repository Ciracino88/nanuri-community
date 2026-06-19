import exifr from "exifr";

export interface GpsCoords {
  latitude: number;
  longitude: number;
}

export async function extractGpsFromImage(file: File): Promise<GpsCoords | null> {
  try {
    const result = await exifr.gps(file);
    if (!result?.latitude || !result?.longitude) return null;
    return { latitude: result.latitude, longitude: result.longitude };
  } catch {
    return null;
  }
}
