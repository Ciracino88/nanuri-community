export interface MenuItem {
  name: string;
  price?: string;
  category?: string;
  options?: { label: string; price?: string }[];
}

export async function extractMenusFromImage(imageFiles: File[]): Promise<MenuItem[]> {
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const images = await Promise.all(
    imageFiles.map(async (file) => ({
      base64: await toBase64(file),
      mediaType: file.type as "image/jpeg" | "image/png" | "image/webp",
    }))
  );

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true });

  const imageContents = images.map((img) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [
        ...imageContents,
        { type: "text", text: `위 메뉴판 이미지(${images.length}장)에서 메뉴 목록을 모두 추출해줘. 여러 장인 경우 중복 없이 합쳐서 출력해.

규칙:
1. 메뉴명은 반드시 메뉴판에 표기된 한국어 이름을 사용해. 영어 번역명이 병기되어 있어도 한국어 이름을 우선해.
2. 아래 패턴 중 하나라도 해당되면 options 배열로 분리해:
   - HOT / ICE / COLD 구분이 있는 경우
   - 괄호 안에 선택지가 있는 경우 (예: 콜드브루(오리지널/디카페인) → 오리지널, 디카페인 두 옵션)
   - 슬래시(/)로 선택지가 나열된 경우 (예: 카페라떼/카푸치노 → 각각 별도 옵션)
   - 사이즈 구분이 있는 경우 (예: S/M/L, Regular/Large)
   - "~중 선택", "~택1" 등의 표현이 있는 경우
3. 옵션별로 가격이 다르면 각 옵션에 가격을 기재하고, 가격이 동일하면 상위 price에만 기재해.
4. 카테고리는 메뉴판의 섹션 제목을 그대로 사용해 (예: CHICKENS, SIDE MENUS, LATTE 등).
5. 가격은 숫자만 추출하되 단위는 생략해 (예: "23,000" → "23,000", "3.7" → "3.7").
6. 설명 없이 JSON 배열만 출력해.

출력 형식:
[{"name": "메뉴명", "price": "가격(옵션별 가격이 다를 경우 생략)", "category": "카테고리", "options": [{"label": "옵션명", "price": "가격"}]}]

옵션이 없으면 options는 빈 배열로.` },
      ],
    }],
  });

  const raw = (response.content[0] as { text: string }).text.trim();
  const text = raw.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  return JSON.parse(text);
}
