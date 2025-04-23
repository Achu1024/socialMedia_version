import { HomeContainer } from '@/container/home-contanier';
import { Providers } from '@/provider/providers';
import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import 'react-photo-view/dist/react-photo-view.css';
import './globals.css';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '社交平台 - 连接你的世界',
  description:
    '一个现代化的社交媒体平台，帮助你与朋友保持联系、分享生活点滴、探索有趣内容',
  keywords: '社交平台,社交媒体,朋友,分享,探索,交友',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <body className={`${geistMono.variable} antialiased`}>
        <Providers>
          <HomeContainer>{children}</HomeContainer>
        </Providers>
      </body>
    </html>
  );
}
