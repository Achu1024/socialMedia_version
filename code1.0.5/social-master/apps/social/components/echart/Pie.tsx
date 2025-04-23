'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart, Cell } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { personalityLabels } from '@/lib/utils';
import { useAdminUserStatistics } from '@/http/useAdmin';

// MBTI类型的颜色映射
const mbtiColors = {
  // 分析家(NT): 紫色系
  INTJ: 'var(--chart-1)',
  INTP: 'var(--chart-2)',
  ENTJ: 'var(--chart-3)',
  ENTP: 'var(--chart-4)',

  // 外交家(NF): 绿色系
  INFJ: 'var(--chart-5)',
  INFP: 'var(--chart-6)',
  ENFJ: 'var(--chart-7)',
  ENFP: 'var(--chart-8)',

  // 守卫者(SJ): 蓝色系
  ISTJ: 'var(--chart-9)',
  ISFJ: 'var(--chart-10)',
  ESTJ: 'var(--chart-11)',
  ESFJ: 'var(--chart-12)',

  // 探索者(SP): 橙色系
  ISTP: 'var(--chart-13)',
  ISFP: 'var(--chart-14)',
  ESTP: 'var(--chart-15)',
  ESFP: 'var(--chart-16)',
};

export function Component() {
  const { data, isLoading } = useAdminUserStatistics();

  // 处理加载状态和数据为空的情况
  if (isLoading || !data) {
    return (
      <Card className='flex flex-col'>
        <CardHeader className='items-center pb-0'>
          <CardTitle>MBTI性格分布</CardTitle>
          <CardDescription>用户性格类型统计</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pb-0 flex items-center justify-center'>
          <div className='animate-pulse h-[250px] w-[250px] rounded-full bg-muted/20'></div>
        </CardContent>
      </Card>
    );
  }

  // 准备图表数据
  // @ts-ignore
  const chartData = Object.entries(data.mbti_statistics || {}).map(
    ([type, count]) => ({
      mbti: type,
      users: count,
      label: personalityLabels[type] || type,
    })
  );

  // 如果没有数据，显示提示信息
  if (chartData.length === 0) {
    return (
      <Card className='flex flex-col'>
        <CardHeader className='items-center pb-0'>
          <CardTitle>MBTI性格分布</CardTitle>
          <CardDescription>用户性格类型统计</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pb-0 flex items-center justify-center'>
          <div className='text-center text-muted-foreground'>暂无MBTI数据</div>
        </CardContent>
      </Card>
    );
  }

  // 计算总人数
  // @ts-ignore
  const totalUsers = chartData.reduce((acc, curr) => acc + curr.users, 0);

  // 创建图表配置
  const chartConfig: ChartConfig = {
    users: {
      label: '用户数',
    },
  };

  // 添加MBTI类型配置
  chartData.forEach((item) => {
    chartConfig[item.mbti] = {
      label: `${item.mbti} (${item.label})`,
      color:
        mbtiColors[item.mbti as keyof typeof mbtiColors] ||
        'hsl(var(--chart-1))',
    };
  });

  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>MBTI性格分布</CardTitle>
        <CardDescription>用户性格类型统计</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[250px]'
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey='users'
              nameKey='mbti'
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    mbtiColors[entry.mbti as keyof typeof mbtiColors] ||
                    `hsl(var(--chart-${(index % 16) + 1}))`
                  }
                />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalUsers}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground'
                        >
                          用户总数
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 font-medium leading-none'>
          {/* @ts-ignore */}
          {data.mbti_statistics &&
            // @ts-ignore
            Object.keys(data.mbti_statistics).length > 0 &&
            // @ts-ignore
            `共有 ${Object.keys(data.mbti_statistics).length} 种MBTI类型`}
          <TrendingUp className='h-4 w-4' />
        </div>
        <div className='leading-none text-muted-foreground'>
          排名前三的性格类型:{' '}
          {chartData
            // @ts-ignore
            .sort((a, b) => b.users - a.users)
            .slice(0, 3)
            .map((item) => item.mbti)
            .join('、')}
        </div>
      </CardFooter>
    </Card>
  );
}
