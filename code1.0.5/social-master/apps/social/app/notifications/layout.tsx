import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '通知 - 社交平台',
  description: '查看你的最新通知、互动和提醒',
  keywords: '通知,提醒,消息,互动,回复,点赞',
};

export default function NotificationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
