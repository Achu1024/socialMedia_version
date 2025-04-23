import { useChatStore } from '@/store/chat';
import { CozeAPI } from '@coze/api';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { toast } from 'react-hot-toast';

// 创建API客户端
const apiClient = new CozeAPI({
  token: process.env.NEXT_PUBLIC_COZE_API_KEY as string,
  baseURL: process.env.NEXT_PUBLIC_COZE_API_URL as string,
  allowPersonalAccessTokenInBrowser: true,
});

// 消息类型定义
export interface Message {
  user_id: string;
  lines: string;
}

// AI请求参数类型
export interface AiRequestParams {
  input: Message[];
  requester: string;
  [key: string]: unknown;
}

// 流式响应处理回调类型
export interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 从AI响应中提取示例内容
 * @param text AI返回的完整文本
 * @returns 提取的示例数组
 */
export const extractExamples = (text: string): string[] => {
  const examples: string[] = [];

  // 使用正则表达式匹配"示例X"后面的内容
  const regex = /- \*\*示例\d+\*\*：(.*?)(?=\n|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      examples.push(match[1].trim());
    }
  }

  return examples;
};

/**
 * ### 使用AI流式聊天功能
 * @returns AI流式聊天的mutation函数和状态以及流式响应处理函数
 */
export const useAiChat = () => {
  //   const queryClient = useQueryClient();
  const [streamResponse, setStreamResponse] = useState<string>('');
  const [exampleResponses, setExampleResponses] = useState<string[]>([]);
  const { setThemeList } = useChatStore();
  // 流式响应处理函数
  const handleStreamResponse = async (stream: any) => {
    let fullResponse = '';
    try {
      for await (const chunk of stream) {
        if (chunk && chunk.event) {
          // 处理消息事件，提取AI返回的内容
          if (chunk.event === 'Message' && chunk.data) {
            try {
              const data =
                typeof chunk.data === 'string'
                  ? JSON.parse(chunk.data)
                  : chunk.data;

              // 处理data.content (可能是字符串形式的JSON或直接是字符串)
              if (data.content) {
                try {
                  // 尝试解析为JSON
                  const contentData =
                    typeof data.content === 'string' &&
                    data.content.trim().startsWith('{')
                      ? JSON.parse(data.content)
                      : { output: data.content };
                  // 提取输出内容
                  if (contentData.output) {
                    // 添加输出到完整响应中
                    fullResponse += contentData.output;
                    // 立即更新流响应状态
                    flushSync(() => setStreamResponse(fullResponse));
                    // 提取并更新示例响应
                    const examples = extractExamples(fullResponse);
                    examples.forEach((item) => {
                      console.log(item);                    
                      setThemeList(item);
                    });
                    if (examples.length > 0) {
                      setExampleResponses(examples);
                    }
                  } else if (typeof contentData === 'string') {
                    // 如果contentData直接是字符串
                    fullResponse += contentData;
                    flushSync(() => setStreamResponse(fullResponse));
                    // 提取并更新示例响应
                    const examples = extractExamples(fullResponse);
                    if (examples.length > 0) {
                      setExampleResponses(examples);
                    }
                  } else if (contentData.theme) {
                  }
                } catch (e) {
                  if (typeof data.content === 'string') {
                    fullResponse += data.content;
                    setStreamResponse(fullResponse);
                    // 提取并更新示例响应
                    const examples = extractExamples(fullResponse);
                    if (examples.length > 0) {
                      setExampleResponses(examples);
                    }
                  }
                }
              } else if (data.text || data.message) {
                // 处理其他可能的响应格式
                const content = data.text || data.message;
                if (content) {
                  fullResponse += content;
                  setStreamResponse(fullResponse);
                  // 提取并更新示例响应
                  const examples = extractExamples(fullResponse);
                  if (examples.length > 0) {
                    setExampleResponses(examples);
                  }
                }
              }
            } catch (parseError) {
              console.error('解析Message事件数据失败:', parseError);
              // 尝试直接使用chunk.data
              if (typeof chunk.data === 'string') {
                fullResponse += chunk.data;
                setStreamResponse(fullResponse);
                // 提取并更新示例响应
                const examples = extractExamples(fullResponse);
                if (examples.length > 0) {
                  setExampleResponses(examples);
                }
              }
            }
          }
          // 处理Done事件，提取debug_url
          else if (chunk.event === 'Done') {
            try {
              const dataObj =
                typeof chunk.data === 'string'
                  ? JSON.parse(chunk.data)
                  : chunk.data;
              if (dataObj && dataObj.debug_url) {
              }
            } catch (e) {
              console.error('解析Done事件数据失败:', e);
            }
          }
        }
      }

      // 最后一次确保提取到所有示例
      const finalExamples = extractExamples(fullResponse);
      if (finalExamples.length > 0) {
        setExampleResponses(finalExamples);
      }

      return fullResponse;
    } catch (error) {
      const err = error as Error;
      toast.error('处理AI响应流失败: ' + (err.message || '未知错误'));
      throw err;
    }
  };

  const mutation = useMutation({
    mutationFn: async ({ params }: { params: AiRequestParams }) => {
      setStreamResponse(''); // 重置响应状态
      setExampleResponses([]); // 重置示例响应
      const response = apiClient.workflows.runs.stream({
        workflow_id: '7484823801077219369',
        parameters: params,
      });

      return handleStreamResponse(response);
    },

    onError: (error: Error) => {
      console.error('AI聊天请求失败:', error);
      toast.error('AI聊天请求失败: ' + (error.message || '未知错误'));
    },
  });

  return {
    ...mutation,
    streamResponse,
    setStreamResponse,
    exampleResponses,
  };
};
