import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Bridge", template: "%s · Bridge" },
  description: "From Reel to delivered order.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Bridge
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
