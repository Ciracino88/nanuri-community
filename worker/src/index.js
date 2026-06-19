export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 업로드
    if (request.method === "POST" && url.pathname === "/upload") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
          return new Response(JSON.stringify({ error: "파일 없음" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const ext = file.name.split(".").pop();
        const key = `receipts/${crypto.randomUUID()}.${ext}`;

        await env.R2_BUCKET.put(key, file.stream(), {
          httpMetadata: { contentType: file.type },
        });

        const fileUrl = `${env.R2_PUBLIC_URL}/${key}`;

        return new Response(JSON.stringify({ url: fileUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 삭제
    if (request.method === "POST" && url.pathname === "/delete") {
      try {
        const { receiptUrl } = await request.json();
        const key = receiptUrl.replace(`${env.R2_PUBLIC_URL}/`, "");

        await env.R2_BUCKET.delete(key);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 역지오코딩 (카카오)
    if (request.method === "GET" && url.pathname === "/geocode") {
      try {
        const lat = url.searchParams.get("lat");
        const lng = url.searchParams.get("lng");

        if (!lat || !lng) {
          return new Response(JSON.stringify({ error: "lat, lng 파라미터가 필요합니다" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const kakaoRes = await fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
          { headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` } }
        );

        if (!kakaoRes.ok) {
          const body = await kakaoRes.text();
          return new Response(JSON.stringify({ error: "카카오 API 호출 실패", status: kakaoRes.status, body }), {
            status: kakaoRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await kakaoRes.json();
        const doc = data.documents?.[0];

        if (!doc) {
          return new Response(JSON.stringify(null), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          address: doc.address?.address_name ?? "",
          roadAddress: doc.road_address?.address_name ?? "",
          buildingName: doc.road_address?.building_name ?? "",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
