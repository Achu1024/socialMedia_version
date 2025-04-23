'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMBTI, useSaveMBTI } from '@/http/useMibt';
import { useEffect, useState } from 'react';

// MBTI类型映射
const personalityTypes = {
  ISTJ: { category: 'sentinel', label: '检查者' },
  ISFJ: { category: 'sentinel', label: '保护者' },
  ESTJ: { category: 'sentinel', label: '总监' },
  ESFJ: { category: 'sentinel', label: '领事' },
  ISTP: { category: 'explorer', label: '鉴赏家' },
  ISFP: { category: 'explorer', label: '探险家' },
  ESTP: { category: 'explorer', label: '企业家' },
  ESFP: { category: 'explorer', label: '表演者' },
  INFJ: { category: 'diplomat', label: '提倡者' },
  INTJ: { category: 'analyst', label: '建筑师' },
  INFP: { category: 'diplomat', label: '调停者' },
  INTP: { category: 'analyst', label: '逻辑学家' },
  ENFJ: { category: 'diplomat', label: '主人公' },
  ENTJ: { category: 'analyst', label: '指挥官' },
  ENFP: { category: 'diplomat', label: '竞选者' },
  ENTP: { category: 'analyst', label: '辩论家' },
};

interface MBTITestProps {
  onComplete?: (result: MBTIResult) => void;
}

export interface MBTIResult {
  personality_type: string;
  personality_category: string;
  introversion_score: number;
  extroversion_score: number;
  intuition_score: number;
  sensing_score: number;
  thinking_score: number;
  feeling_score: number;
  judging_score: number;
  perceiving_score: number;
  created_at?: string;
}

const MBTITest = ({ onComplete }: MBTITestProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { data: questions, isLoading: isLoadingQuestions } = useMBTI();

  // 从localStorage恢复测试状态
  useEffect(() => {
    if (!questions) return;

    const savedAnswers = localStorage.getItem('mbti_answers');
    const savedQuestionIndex = localStorage.getItem('mbti_current_question');
    const savedResults = localStorage.getItem('mbti_results');

    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }

    if (savedQuestionIndex) {
      const index = Number(savedQuestionIndex);
      // 确保索引有效且在问题范围内
      if (!isNaN(index) && index >= 0 && index < questions.question.length) {
        setCurrentQuestionIndex(index);
      }
    }

    if (savedResults) {
      setResult(JSON.parse(savedResults));
      setShowResults(true);
    }
    setIsLoading(false);
  }, [questions]);

  // 更新进度条
  useEffect(() => {
    if (questions) {
      setProgress(
        ((currentQuestionIndex + 1) / questions.question.length) * 100
      );
    }
  }, [currentQuestionIndex, questions]);

  // 保存测试状态到localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('mbti_answers', JSON.stringify(answers));
    }

    localStorage.setItem(
      'mbti_current_question',
      currentQuestionIndex.toString()
    );

    if (result) {
      localStorage.setItem('mbti_results', JSON.stringify(result));
    }
  }, [answers, currentQuestionIndex, result]);

  const handleAnswer = (value: string) => {
    if (!questions) return;
    const newAnswers = { ...answers, [currentQuestionIndex]: value };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions?.question.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  // 计算各项分数
  const calculateResults = (finalAnswers: Record<number, string>) => {
    if (!questions) return;
    // 计算各项分数
    let eScore = 0;
    let iScore = 0;
    let sScore = 0;
    let nScore = 0;
    let tScore = 0;
    let fScore = 0;
    let jScore = 0;
    let pScore = 0;

    for (let i = 0; i < questions.question.length; i++) {
      const answer = finalAnswers[i];
      const question = questions.question[i];

      if (!answer) continue;

      if (answer === question.value1) {
        switch (answer) {
          case 'E':
            eScore++;
            break;
          case 'I':
            iScore++;
            break;
          case 'S':
            sScore++;
            break;
          case 'N':
            nScore++;
            break;
          case 'T':
            tScore++;
            break;
          case 'F':
            fScore++;
            break;
          case 'J':
            jScore++;
            break;
          case 'P':
            pScore++;
            break;
        }
      } else if (answer === question.value2) {
        switch (answer) {
          case 'E':
            eScore++;
            break;
          case 'I':
            iScore++;
            break;
          case 'S':
            sScore++;
            break;
          case 'N':
            nScore++;
            break;
          case 'T':
            tScore++;
            break;
          case 'F':
            fScore++;
            break;
          case 'J':
            jScore++;
            break;
          case 'P':
            pScore++;
            break;
        }
      }
    }

    // 确定最终人格类型
    const personality_type = `${iScore > eScore ? 'I' : 'E'}${
      nScore > sScore ? 'N' : 'S'
    }${fScore > tScore ? 'F' : 'T'}${pScore > jScore ? 'P' : 'J'}`;

    const mbtiResult: MBTIResult = {
      personality_type,
      personality_category:
        personalityTypes[personality_type as keyof typeof personalityTypes]
          ?.category || '',
      introversion_score: iScore,
      extroversion_score: eScore,
      intuition_score: nScore,
      sensing_score: sScore,
      thinking_score: tScore,
      feeling_score: fScore,
      judging_score: jScore,
      perceiving_score: pScore,
    };

    setResult(mbtiResult);
    setShowResults(true);

    if (onComplete) {
      onComplete(mbtiResult);
    }
  };

  const resetTest = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setResult(null);
    localStorage.removeItem('mbti_answers');
    localStorage.removeItem('mbti_current_question');
    localStorage.removeItem('mbti_results');
  };

  if (isLoadingQuestions || isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }
  if (!questions) return null;

  if (showResults && result) {
    const personalityType =
      personalityTypes[
        result.personality_type as keyof typeof personalityTypes
      ];

    return (
      <Card className='w-full max-w-3xl mx-auto shadow-lg'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>您的MBTI测试结果</CardTitle>
          <CardDescription>
            根据您的回答，我们分析了您的个性特征
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-center mb-6'>
            <h3 className='text-4xl font-bold text-primary'>
              {result.personality_type}
            </h3>
            <p className='text-xl mt-2'>
              {personalityType?.label || '未知类型'}
            </p>
          </div>

          <div className='grid gap-4'>
            <div className='flex justify-between items-center'>
              <span>内向 (I): {result.introversion_score}</span>
              <span>外向 (E): {result.extroversion_score}</span>
            </div>
            <Progress
              value={
                (result.introversion_score /
                  (result.introversion_score + result.extroversion_score)) *
                100
              }
            />

            <div className='flex justify-between items-center'>
              <span>直觉 (N): {result.intuition_score}</span>
              <span>感觉 (S): {result.sensing_score}</span>
            </div>
            <Progress
              value={
                (result.intuition_score /
                  (result.intuition_score + result.sensing_score)) *
                100
              }
            />

            <div className='flex justify-between items-center'>
              <span>感性 (F): {result.feeling_score}</span>
              <span>思考 (T): {result.thinking_score}</span>
            </div>
            <Progress
              value={
                (result.feeling_score /
                  (result.feeling_score + result.thinking_score)) *
                100
              }
            />

            <div className='flex justify-between items-center'>
              <span>判断 (J): {result.judging_score}</span>
              <span>感知 (P): {result.perceiving_score}</span>
            </div>
            <Progress
              value={
                (result.judging_score /
                  (result.judging_score + result.perceiving_score)) *
                100
              }
            />
          </div>
        </CardContent>
        <CardFooter className='flex justify-center space-x-4'>
          <Button variant='outline' onClick={resetTest}>
            重新测试
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = questions.question[currentQuestionIndex];

  return (
    <Card className='w-full max-w-2xl mx-auto shadow-lg'>
      <CardHeader>
        <CardTitle className='text-xl'>
          MBTI人格测试 ({currentQuestionIndex + 1}/{questions.question.length})
        </CardTitle>
        <CardDescription>选择最符合您的选项</CardDescription>
        <Progress value={progress} className='mt-2' />
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='text-center mb-6'>
          <h3 className='text-xl font-medium'>{currentQuestion.topic}</h3>
        </div>
        <div className='grid gap-4'>
          <Button
            variant={
              answers[currentQuestionIndex] === currentQuestion.value1
                ? 'default'
                : 'outline'
            }
            className='justify-start text-left h-auto py-3 px-4'
            onClick={() => handleAnswer(currentQuestion.value1)}
          >
            {currentQuestion.option1}
          </Button>
          <Button
            variant={
              answers[currentQuestionIndex] === currentQuestion.value2
                ? 'default'
                : 'outline'
            }
            className='justify-start text-left h-auto py-3 px-4'
            onClick={() => handleAnswer(currentQuestion.value2)}
          >
            {currentQuestion.option2}
          </Button>
        </div>
      </CardContent>
      <CardFooter className='flex justify-between'>
        <Button
          variant='ghost'
          onClick={() =>
            currentQuestionIndex > 0 &&
            setCurrentQuestionIndex(currentQuestionIndex - 1)
          }
          disabled={currentQuestionIndex === 0}
        >
          上一题
        </Button>
        <div className='text-sm text-muted-foreground'>
          {Object.keys(answers).length} 题已回答
        </div>
        <Button
          variant='ghost'
          onClick={() =>
            currentQuestionIndex < questions.question.length - 1 &&
            setCurrentQuestionIndex(currentQuestionIndex + 1)
          }
          disabled={
            currentQuestionIndex === questions.question.length - 1 ||
            !answers[currentQuestionIndex]
          }
        >
          下一题
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MBTITest;
