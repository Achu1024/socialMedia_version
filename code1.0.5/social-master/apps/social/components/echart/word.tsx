'use client';
import React, { useEffect, useRef, useState } from 'react';
import { getTrend } from '@/http/usePost';
import dynamic from 'next/dynamic';

// 定义Trend接口
interface Trend {
  hashtag: string;
  occurences: number;
}

// 动态导入WordCloud组件，确保它只在客户端渲染
const DynamicWordCloud = dynamic<{ trends: Trend[] }>(
  () => import('./WordCloudClient'),
  {
    ssr: false,
    loading: () => (
      <div className='flex justify-center items-center h-60'>加载中...</div>
    ),
  }
);

const WordCloud: React.FC = () => {
  const { data: trends, isLoading } = getTrend();

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-60'>加载中...</div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <div className='flex justify-center items-center h-60'>暂无数据</div>
    );
  }

  return <DynamicWordCloud trends={trends} />;
};

export default WordCloud;
