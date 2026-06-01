import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenCarts — Live',
  description: 'Real-time open carts dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
