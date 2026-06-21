import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BarBoy - Asisten Burger Bangor',
  description: 'Asisten virtual Burger Bangor Indonesia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
