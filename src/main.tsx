import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { useAuthStore } from "./store/authStore";
import { ConfirmHost } from "./components/ConfirmDialog";
import DevPreviewPage from "./pages/dev/DevPreviewPage";
import "./index.css";

const queryClient = new QueryClient();

// 개발 전용 UI 미리보기(/__dev/*). 앱 라우터 바깥에 둬야 미리보기 쪽에서 MemoryRouter 로
// 경로와 인증 상태를 꾸며 띄울 수 있다(라우터는 중첩이 안 된다). 프로덕션 빌드에서는
// import.meta.env.DEV 가 false 라 이 가지가 통째로 트리셰이킹된다.
const isDevPreview = import.meta.env.DEV && window.location.pathname.startsWith("/__dev/");

function Root() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initialize().then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <ConfirmHost />
      <Toaster
        position="top-center"
        gutter={8}
        containerStyle={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(22,25,35,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(116,199,255,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            borderRadius: "16px",
            padding: "12px 16px",
            width: "min(92vw, 420px)",
          },
        }}
      />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isDevPreview ? <DevPreviewPage /> : <Root />}
    </QueryClientProvider>
  </StrictMode>
);