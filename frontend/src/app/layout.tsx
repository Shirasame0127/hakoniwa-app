import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AI箱庭ライフOS",
  description: "3D箱庭Webアプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="bg-[#0a0f1a] text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
