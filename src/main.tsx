import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { useAuthStore } from "./store/authStore";
import "./index.css";

const queryClient = new QueryClient();

function Root() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initialize().then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, []);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </StrictMode>
);