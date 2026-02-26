import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bus 678 Tracker",
  description: "Real-time tracking for Singapore bus service 678",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
