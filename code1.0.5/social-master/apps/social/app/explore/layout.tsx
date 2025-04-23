import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '探索 - 社交平台',
  description: '探索热门话题、发现有趣内容和结交新朋友',
  keywords: '探索,发现,热门,趋势,话题,内容,社区',
};

export default function ExploreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
