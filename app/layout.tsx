import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "LifeLog | 日々の記録を、AIが活用できる資産に。",
  description: "LifeLogは、あなたの思考、活動、学習をシンプルに蓄積。独自のプロトコルを通じて、パーソナルAIの知性を進化させます。",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeLog",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "LifeLog",
    title: "LifeLog | 1日の記録を資産に変える",
    description: "LifeLogは、あなたの思考、活動、学習をシンプルに蓄積。独自のプロトコルを通じて、パーソナルAIの知性を進化させます。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LifeLog - 1日の記録を資産に変える",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LifeLog | 1日の記録を資産に変える",
    description: "LifeLogは、あなたの思考、活動、学習をシンプルに蓄積。独自のプロトコルを通じて、パーソナルAIの知性を進化させます。",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#2d3436" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased tracking-tight`}
      >
        {children}
      </body>
    </html>
  );
}
