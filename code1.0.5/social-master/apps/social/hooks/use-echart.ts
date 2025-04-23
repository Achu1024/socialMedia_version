'use client';

import * as echarts from 'echarts';
import { EChartsType } from 'echarts';
import { RefObject, useEffect, useState } from 'react';

const echartInstance = new Set<EChartsType>();

window.addEventListener('resize', () => {
  for (const instance of echartInstance) {
    instance.resize();
  }
});

/**
 * ### 使用echart
 * @param chart
 * @returns
 */
export const useEchartResize = (chart: RefObject<HTMLDivElement | null>) => {
  const [echartInstance, setEchartInstance] = useState<EChartsType>();
  useEffect(() => {
    if (!chart.current) return;
    const instance = echarts.init(chart.current);
    setEchartInstance(instance);
  }, [chart]);
  return echartInstance;
};
