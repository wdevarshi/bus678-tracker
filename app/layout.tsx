import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SG Bus Tracker",
  description: "Track Singapore bus arrivals in real-time",
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
