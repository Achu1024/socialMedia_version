import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '个人资料 - 社交平台',
  description: '管理你的个人资料、查看你的动态和朋友互动',
  keywords: '个人资料,用户,动态,互动,社交,朋友',
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
