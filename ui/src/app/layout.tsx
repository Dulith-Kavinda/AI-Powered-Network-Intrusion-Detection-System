import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI-NIDS | Live Network Intrusion Detection & Traffic Analyzer",
  description: "AI-Powered Network Intrusion Detection System featuring real-time packet capture, 500-flow batch processing, and Cascade Multiclass + Anomaly Autoencoder AI pipeline.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">{children}</body>
    </html>
  );
}
