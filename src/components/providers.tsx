"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StripeSync } from "@/components/donations/stripe-sync";
import { MoodProvider } from "@/components/theme/mood-provider";
import { DB_STORAGE_KEY } from "@/config/constants";
import { MOOD_STORAGE_KEY } from "@/config/moods";
import { useDemoStore } from "@/stores/demo-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useDemoStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === DB_STORAGE_KEY) useDemoStore.getState().reloadFromStorage();
      if (event.key === MOOD_STORAGE_KEY && event.newValue) {
        document.documentElement.setAttribute("data-mood", event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <MoodProvider>
        <TooltipProvider delay={200}>
          {children}
          <StripeSync />
          <Toaster position="top-right" />
        </TooltipProvider>
      </MoodProvider>
    </ThemeProvider>
  );
}
