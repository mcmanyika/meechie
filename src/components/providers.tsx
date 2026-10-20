"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StripeSync } from "@/components/donations/stripe-sync";
import { DB_STORAGE_KEY } from "@/config/constants";
import { useDemoStore } from "@/stores/demo-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useDemoStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === DB_STORAGE_KEY) useDemoStore.getState().reloadFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delay={200}>
        {children}
        <StripeSync />
        <Toaster position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
