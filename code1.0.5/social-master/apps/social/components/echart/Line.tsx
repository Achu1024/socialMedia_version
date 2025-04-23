'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface Trend {
  hashtag: string;
  occurences: number;
}

interface LineChartProps {
  data: Trend[];
}

export const Component = ({ data }: LineChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.hashtag),
        axisLabel: {
          interval: 0,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '热度',
      },
      series: [
        {
          name: '热度',
          type: 'line',
          data: data.map((item) => item.occurences),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#2563eb',
          },
          lineStyle: {
            width: 3,
            color: '#2563eb',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(37, 99, 235, 0.3)',
              },
              {
                offset: 1,
                color: 'rgba(37, 99, 235, 0.1)',
              },
            ]),
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <div
      ref={chartRef}
      className='w-full h-[300px]'
    />
  );
}; 