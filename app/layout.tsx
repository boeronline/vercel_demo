import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'LifeGraph Lite',
  description:
    'Upload CSV-data en ontdek relaties tussen mensen, deals, events en workouts via een interactieve graph.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" className="bg-background">
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  );
}
