import { MBTIResult } from '@/container/mibt-contanier/MBTITest';
import { get, post } from '@/lib/http';
import { useMutation, useQuery } from '@tanstack/react-query';

interface Question {
  topic: string;
  option1: string;
  option2: string;
  value1: string;
  value2: string;
}

interface MBTIData {
  question: Question[];
}

interface MBTIStatistics {
  type: string;
  count: number;
}

/**
 * ### 获取MBTI测试题
 * @returns MBTI测试题
 */
export const useMBTI = () => {
  return useQuery<MBTIData>({
    queryKey: ['mbti'],
    queryFn: async () => {
      const response = await fetch('/MBTItest.json');
      return response.json();
    },
  });
};

/**
 * ### 保存MBTI测试结果
 * @returns 保存MBTI测试结果
 */
export const useSaveMBTI = () => {
  return useMutation({
    mutationFn: async (data: MBTIResult) => {
      const response = await post('/mibt/save/', data);
      return response.json();
    },
  });
};

/**
 * ### 获取MBTI统计数据
 * @returns MBTI类型分布统计
 */
export const useMBTIStatistics = () => {
  return useQuery<MBTIStatistics[]>({
    queryKey: ['mbti-statistics'],
    queryFn: async () => {
      const response = await get('/mibt/statistics/');
      return response;
    },
  });
};
