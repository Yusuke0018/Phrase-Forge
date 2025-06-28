import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SideMenu } from "@/components/Navigation/SideMenu";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "Phrase Forge - 言葉を鍛える道場",
  description: "スキマ時間で英語フレーズを瞬時に引き出せるようになる実践的学習ツール",
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} font-sans antialiased bg-gray-50`}
      >
        <SideMenu />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
