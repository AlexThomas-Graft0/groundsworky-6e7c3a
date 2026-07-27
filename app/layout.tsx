import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'groundsworky',
  description:
    'A groundworks contractor doing site clearance, excavation, foundations, drainage and concreting for builders and developers. We want an internal tool (not a public site) to track the true cost and margin of each site against what we quoted.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-white text-[#111827] font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}