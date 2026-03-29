import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProfileSync } from "@/components/auth/auth-profile-sync";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Work OS",
  description: "Personal task workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-dvh flex-col bg-black text-white antialiased"
        suppressHydrationWarning
      >
        <AuthProfileSync />
        {children}
      </body>
    </html>
  );
}
