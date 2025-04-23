import AdminContainer from '@/container/admin-contanier';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '运营后台 - 社交平台',
  description: '平台管理员控制台，管理用户、内容和系统设置',
  keywords: '管理员,控制台,后台,管理,系统,设置,运营',
  robots: 'noindex, nofollow', // 防止搜索引擎索引管理页面
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminContainer>{children}</AdminContainer>;
}
