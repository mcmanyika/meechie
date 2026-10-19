"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || "The page could not be shown."}</p>
      <button type="button" className="mt-4 rounded-lg border px-3 py-2 text-sm" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
