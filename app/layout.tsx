import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Prediction Paper Trader",
  description: "Private dashboard for paper trading live sports prediction markets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
