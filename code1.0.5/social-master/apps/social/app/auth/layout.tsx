import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

export const metadata: Metadata = {
  title: '用户认证 - 社交平台',
  description: '登录、注册或找回密码，加入我们的社交平台',
  keywords: '登录,注册,认证,账户,密码,社交平台',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
