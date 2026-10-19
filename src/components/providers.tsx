"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useDemoStore } from "@/stores/demo-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useDemoStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delay={200}>
        {children}
        <Toaster position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
