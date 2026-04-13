import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paper Sports Prediction Dashboard',
  description: 'Private paper trading cockpit for live sports prediction markets.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
