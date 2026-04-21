// src/app/layout.tsx
import type { Metadata } from "next";
import { Unbounded, Golos_Text } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import ConditionalHeader from "@/components/blocks/Header/ConditionalHeader";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-unbounded",
});

const golos = Golos_Text({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-golos",
});

export const metadata: Metadata = {
  title: "Мой ПТК — Система учёта оборудования",
  description: "Централизованная информационная система для инвентаризации, отслеживания перемещений и планирования обслуживания техники",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${golos.variable}`} suppressHydrationWarning>
      <body className="font-golos bg-white dark:bg-[#0c0b18] text-gray-900 dark:text-white antialiased min-h-screen overflow-x-hidden">
        <ThemeProvider>
          <AuthProvider>
            <ConditionalHeader />
            <div>
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}