import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "678",
  description: "Bus 678 — Punggol to CBD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
