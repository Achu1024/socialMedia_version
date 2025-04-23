import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '动态 - 社交平台',
  description: '浏览用户动态、评论与互动',
  keywords: '动态,帖子,评论,互动,分享,社交',
};

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
