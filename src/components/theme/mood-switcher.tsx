"use client";

import { Palette } from "lucide-react";
import { useMood } from "@/components/theme/mood-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export function MoodSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { mood, setMood, moods } = useMood();
  const current = moods.find((item) => item.id === mood) ?? moods[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={compact ? "ghost" : "outline"}
            size={compact ? "icon" : "sm"}
            className={cn(!compact && "gap-2 text-muted-foreground", className)}
            aria-label={`Mood: ${current.label}`}
          />
        }
      >
        {compact ? (
          <Palette className="size-4" />
        ) : (
          <>
            <span className="size-2.5 rounded-full border" style={{ background: current.swatch }} aria-hidden />
            <span className="hidden sm:inline">{current.label}</span>
            <Palette className="size-3.5 opacity-70 sm:hidden" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Mood</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {moods.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setMood(item.id)}
              className={cn(mood === item.id && "bg-muted")}
            >
              <span className="mt-0.5 size-3 shrink-0 rounded-full border" style={{ background: item.swatch }} aria-hidden />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.blurb}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
