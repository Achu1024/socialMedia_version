'use client';
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { useEchartResize } from '@/hooks/use-echart';

interface Trend {
  hashtag: string;
  occurences: number;
}

interface WordCloudClientProps {
  trends: Trend[];
}

const WordCloudClient: React.FC<WordCloudClientProps> = ({ trends }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const echartInstance = useEchartResize(chartRef);

  useEffect(() => {
    if (echartInstance && trends && trends.length > 0) {
      const option = {
        series: [
          {
            type: 'wordCloud',
            shape: 'circle',
            left: 'center',
            top: 'center',
            width: '90%',
            height: '90%',
            right: null,
            bottom: null,
            sizeRange: [12, 60],
            rotationRange: [-90, 90],
            rotationStep: 45,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              color: function () {
                return (
                  'rgb(' +
                  [
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                  ].join(',') +
                  ')'
                );
              },
            },
            emphasis: {
              focus: 'self',
              textStyle: {
                shadowBlur: 10,
                shadowColor: '#333',
              },
            },
            data: trends.map((item) => ({
              name: item.hashtag,
              value: item.occurences,
            })),
          },
        ],
      };
      echartInstance.setOption(option);
    }
  }, [trends, echartInstance]);

  return (
    <div ref={chartRef} className='w-full h-60 rounded-lg shadow-sm bg-white' />
  );
};

export default WordCloudClient;
