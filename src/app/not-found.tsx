import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">That page is not part of The Meechie Project app.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-primary">Back to sign in</Link>
    </main>
  );
}
