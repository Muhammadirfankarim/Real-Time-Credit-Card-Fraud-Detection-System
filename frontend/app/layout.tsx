import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fraud Detection System - Real-Time Credit Card Fraud Detection',
  description:
    'Advanced ML-powered fraud detection system for credit card transactions. Built with Next.js, TypeScript, and ONNX Runtime.',
  keywords: [
    'fraud detection',
    'machine learning',
    'credit card',
    'real-time',
    'ONNX',
    'Next.js',
    'TypeScript',
  ],
  authors: [{ name: 'Muhammad Irfan Karim' }],
  openGraph: {
    title: 'Fraud Detection System',
    description: 'Real-Time Credit Card Fraud Detection with ML',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
        {children}
      </body>
    </html>
  );
}
