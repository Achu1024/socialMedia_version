import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '好友 - 社交平台',
  description: '管理你的好友、查看好友动态和发现新朋友',
  keywords: '好友,朋友,社交圈,关系,联系人,添加好友',
};

export default function FriendsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
