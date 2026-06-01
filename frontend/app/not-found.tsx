import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <h1 className="font-display text-3xl text-ink">Page not found</h1>
      <Link href="/sign-in" className="mt-4 text-sm text-ochre hover:underline">
        Return to sign in
      </Link>
    </div>
  );
}
