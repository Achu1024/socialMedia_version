import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 从名字中获取首字母
 * @param name 名字
 * @returns 首字母（最多两个字符）
 */
export function getInitials(name: string): string {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return name.charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// MBTI类型中文标签映射
export const personalityLabels: Record<string, string> = {
  ISTJ: '检查者',
  ISFJ: '保护者',
  ESTJ: '总监',
  ESFJ: '领事',
  ISTP: '鉴赏家',
  ISFP: '探险家',
  ESTP: '企业家',
  ESFP: '表演者',
  INFJ: '提倡者',
  INTJ: '建筑师',
  INFP: '调停者',
  INTP: '逻辑学家',
  ENFJ: '主人公',
  ENTJ: '指挥官',
  ENFP: '竞选者',
  ENTP: '辩论家',
};
