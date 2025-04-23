import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MBTI测试 - 社交平台',
  description: '参与MBTI性格测试，了解你的性格类型，找到志同道合的朋友',
  keywords: 'MBTI,性格测试,人格类型,心理测试,社交,匹配',
};

export default function MbtiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
