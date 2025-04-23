import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '首页 - 社交平台',
  description: '查看你的个性化信息流、好友动态和推荐内容',
  keywords: '首页,信息流,动态,社交,朋友圈,推荐',
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
