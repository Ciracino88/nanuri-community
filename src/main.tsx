import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { useAuthStore } from "./store/authStore";
import { ConfirmHost } from "./components/ConfirmDialog";
import "./index.css";

const queryClient = new QueryClient();

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
      <Root />
    </QueryClientProvider>
  </StrictMode>
);