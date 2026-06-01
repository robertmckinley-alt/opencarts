import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phat Panda · OpenCarts',
  description: 'Real-time wholesale cart dashboard for Phat Panda',
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
