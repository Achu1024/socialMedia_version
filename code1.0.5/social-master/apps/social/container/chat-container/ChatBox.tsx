import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAiChat } from '@/http/useAi';
import { useProfile } from '@/http/useAuth';
import {
  ChatMessage,
  useChatHistory,
  useRealTimeChat,
  useSendMessage,
} from '@/http/useChat';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ActiveConversation } from './ChatContainer';
import { MessageInput } from './MessageInput';
import Markdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chat';

interface ChatBoxProps {
  conversation: ActiveConversation;
  userId?: string;
  socket: Socket | null;
  isConnected: boolean;
}

export const ChatBox = ({
  conversation,
  userId,
  socket,
  isConnected,
}: ChatBoxProps) => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { themeList } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [showDogCard, setShowDogCard] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showExampleTabs, setShowExampleTabs] = useState(false);
  const [exampleTabContents, setExampleTabContents] = useState<string[]>([]);
  console.log(themeList);
  const {
    mutate: aiChat,
    isPending: isAiChatLoading,
    streamResponse,
    setStreamResponse,
    exampleResponses,
  } = useAiChat();

  console.log(streamResponse);
  // 获取聊天历史
  const { data: chatHistory, isLoading: isLoadingHistory } = useChatHistory(
    conversation.id
  );

  // 当AI回复结束时处理示例
  useEffect(() => {
    if (!isAiChatLoading && streamResponse && streamResponse.length > 0) {
      console.log('AI回复已完成，准备处理示例');
      
      // 检查回复中是否包含示例格式的内容
      const hasExamples = /示例\d+[:：]/.test(streamResponse) || 
                         /\d+[.．]/.test(streamResponse);
      
      console.log('是否包含示例格式:', hasExamples);
    }
  }, [isAiChatLoading, streamResponse]);

  // 重置所有状态
  const resetAllStates = () => {
    setShowExampleTabs(false);
    setExampleTabContents([]);
    setStreamResponse('');
    setShowDogCard(false);
  };

  // 使用实时聊天
  const { sendMessage: sendSocketMessage, sendTypingStatus } = useRealTimeChat(
    userId,
    conversation.userId,
    socket,
    conversation.id
  );

  // 发送消息到服务器
  const { mutate: sendMessageToServer, isPending: isSending } = useSendMessage(
    conversation.id
  );
  useEffect(() => {
    if (isLoadingHistory) {
      return;
    }
    setTimeout(() => {
      if (chatHistory?.length === 0) {
        return;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [chatHistory]);

  // 监听对方正在输入状态
  useEffect(() => {
    if (!socket || !userId) return;

    socket.on('awarenessUpdate', (data: { userId: string; status: string }) => {
      if (data.userId === conversation.userId) {
        setTypingStatus(data.status);
      }
    });

    return () => {
      socket.off('awarenessUpdate');
    };
  }, [socket, userId, conversation.userId]);

  // 提取示例内容
  const extractExamples = (text: string) => {
    console.log('开始提取示例，文本长度:', text.length);
    const examples: string[] = [];
    
    // 基于截图中的格式进行精确匹配
    // "示例1: 其实我也挺难连的，要不我们晚些再家新开的店试试?"
    const regex1 = /示例(\d+)[：:]\s*([^\n]+)/g;
    let match;
    
    while ((match = regex1.exec(text)) !== null) {
      const content = match[2] ? match[2].trim() : '';
      if (content) {
        // 移除内容中的双星号
        const cleanContent = content.replace(/\*\*/g, '');
        console.log(`找到示例${match[1]}:`, cleanContent);
        examples.push(cleanContent);
      }
    }
    
    // 如果没找到，尝试匹配数字列表格式
    if (examples.length === 0) {
      const regex2 = /(\d+)[.．]\s*([^\n]+)/g;
      while ((match = regex2.exec(text)) !== null) {
        const content = match[2] ? match[2].trim() : '';
        if (content) {
          // 移除内容中的双星号
          const cleanContent = content.replace(/\*\*/g, '');
          console.log(`找到列表项${match[1]}:`, cleanContent);
          examples.push(cleanContent);
        }
      }
    }
    
    // 如果还是没找到或不够3个，尝试按行分割查找
    if (examples.length < 3) {
      const lines = text.split('\n');
      for (const line of lines) {
        // 查找明显是示例的行
        if ((line.includes('示例') || /^\d+[.．]/.test(line)) && !examples.includes(line) && line.length > 5) {
          const content = line
            .replace(/^示例\d+[：:]\s*/, '')
            .replace(/^\d+[.．]\s*/, '')
            .trim();
          
          if (content && content.length > 0 && !examples.includes(content)) {
            // 移除内容中的双星号
            const cleanContent = content.replace(/\*\*/g, '');
            console.log('从行中提取示例:', cleanContent);
            examples.push(cleanContent);
          }
        }
      }
    }
    
    // 最后保证只返回最多3个示例
    const result = examples.slice(0, 3);
    console.log('最终提取的示例:', result);
    return result;
  };

  // 处理示例选择的函数
  const handleExampleSelect = (content: string) => {
    console.log('用户选择了示例:', content);
    // 确保传入输入框的内容也没有双星号
    const cleanContent = content.replace(/\*\*/g, '');
    setInputMessage(cleanContent);
    setShowExampleTabs(false);
  };

  // 处理发送消息
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    // 关闭所有弹出内容
    resetAllStates();

    // 先通过API发送消息
    sendMessageToServer(content, {
      onSuccess: () => {
        // 请求成功后发送socket消息
        sendSocketMessage(content, conversation.id);
      },
    });
  };

  // 处理输入状态
  const handleTypingStatus = (status: 'typing' | 'idle') => {
    sendTypingStatus(status);
  };

  // 格式化消息时间
  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: zhCN });
  };

  // 处理话题点击
  const handleThemeClick = (theme: string) => {
    if (theme) {
      // 直接发送消息
      handleSendMessage(theme);
    }
  };

  // 修正可能undefined的avatar属性
  const avatarUrl = conversation.avatar
    ? conversation.avatar.startsWith('http')
      ? conversation.avatar
      : `${process.env.NEXT_PUBLIC_API_URL}${conversation.avatar}`
    : '';

  // 添加一个显示示例标签的组件
  const ExampleTabs = ({ 
    examples, 
    onSelect 
  }: { 
    examples: string[]; 
    onSelect: (content: string) => void 
  }) => {
    // 计算每个标签应占的宽度比例
    const widthClass = 
      examples.length === 1 ? 'w-full' : 
      examples.length === 2 ? 'w-[49%]' : 'w-[32%]';
    
    return (
      <div className="flex flex-wrap gap-2 my-2 justify-start w-full">
        {examples.map((example, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`group relative text-left px-3 py-1.5 hover:bg-primary/10 hover:text-primary transition-colors text-xs font-normal ${widthClass}`}
                  onClick={() => onSelect(example)}
                >
                  <span className="block w-full truncate">
                    {example}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="max-w-xs">{example}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  return (
    <div className='flex flex-col h-full'>
      {/* 聊天对象信息 */}
      <div className='p-4 border-b sticky top-0 bg-white z-10 shadow-sm'>
        <div className='flex items-center'>
          <Link href={`/profile/${conversation.userId}`}>
            <Avatar className='h-10 w-10 mr-3 ring-2 ring-offset-2 ring-opacity-10 ring-gray-200 cursor-pointer hover:scale-105 transition-transform'>
              <AvatarImage
                src={avatarUrl}
              />
              <AvatarFallback className='bg-gradient-to-br from-purple-400 to-pink-500 text-white'>
                {conversation.userName.charAt(0) || <User className='h-4 w-4' />}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${conversation.userId}`} className='hover:text-primary transition-colors'>
              <h3 className='font-medium text-lg cursor-pointer'>{conversation.userName}</h3>
            </Link>
            {typingStatus === 'typing' && (
              <p className='text-xs text-gray-500 flex items-center'>
                <span className='mr-1'>正在输入</span>
                <span className='flex'>
                  <span className='animate-bounce mx-0.5 delay-0'>.</span>
                  <span className='animate-bounce mx-0.5 delay-100'>.</span>
                  <span className='animate-bounce mx-0.5 delay-200'>.</span>
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {isLoadingHistory ? (
          <div className='flex justify-center py-10'>
            <div className='flex flex-col items-center'>
              <div className='w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin'></div>
              <p className='text-gray-500 mt-2 text-sm'>加载消息中...</p>
            </div>
          </div>
        ) : chatHistory?.length === 0 ? (
          <div className='h-full flex items-center justify-center text-gray-400 flex-col'>
            <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='text-gray-400'
              >
                <path d='M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z' />
                <path d='M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1' />
              </svg>
            </div>
            开始和 {conversation.userName} 聊天吧
            <p className='text-xs mt-2'>发送你的第一条消息</p>
          </div>
        ) : (
          chatHistory?.map((msg, index) => {
            // 消息来源判断 - 检查是否为当前用户发送的消息
            const isMine =
              msg.sendId === userId ||
              (msg.created_by && msg.created_by.id === userId);

            // 根据消息来源选择头像和名称
            const showAvatar = isMine
              ? profile?.avatar
              : msg.sent_to?.avatar || conversation.avatar;
            //
            const showName = isMine
              ? profile?.name
              : msg.created_by?.name || conversation.userName;
            // 处理头像URL，确保使用完整路径
            const avatarUrl = showAvatar
              ? showAvatar.startsWith('http')
                ? showAvatar
                : `${process.env.NEXT_PUBLIC_API_URL}${showAvatar}`
              : '';

            // 检查是否需要显示日期分隔
            const showDate =
              index === 0 ||
              (chatHistory?.[index - 1]?.created_at &&
                new Date(
                  chatHistory?.[index - 1].created_at as string
                ).getDate() !== new Date(msg.created_at as string).getDate());

            // 获取消息内容
            const messageContent = msg.message || msg.body || '';

            return (
              <div key={msg.id || index}>
                {showDate && msg.created_at && (
                  <div className='text-center my-4'>
                    <span className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium'>
                      {format(new Date(msg.created_at), 'yyyy年MM月dd日', {
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${
                    isMine ? 'justify-end' : 'justify-start'
                  } group`}
                >
                  <div
                    className={`flex max-w-[75%] ${
                      isMine ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {isMine ? (
                      <Avatar
                        className={`h-8 w-8 mx-2 mt-1 flex-shrink-0 transition-transform group-hover:scale-110 ${
                          isMine ? 'ml-3' : 'mr-3'
                        }`}
                      >
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback
                          className='bg-gradient-to-br from-green-400 to-indigo-500 text-white'
                        >
                          {showName?.charAt(0) || <User className='h-4 w-4' />}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Link href={`/profile/${conversation.userId}`}>
                        <Avatar
                          className={`h-8 w-8 mx-2 mt-1 flex-shrink-0 transition-transform group-hover:scale-110 cursor-pointer ${
                            isMine ? 'ml-3' : 'mr-3'
                          }`}
                        >
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback
                            className='bg-gradient-to-br from-purple-400 to-pink-500 text-white'
                          >
                            {showName?.charAt(0) || <User className='h-4 w-4' />}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    )}

                    <div>
                      <div className='flex items-center mb-1'>
                        {!isMine && (
                          <Link href={`/profile/${conversation.userId}`} className='hover:text-primary transition-colors'>
                            <span className='text-sm font-medium mr-2 text-gray-700 cursor-pointer'>
                              {showName}
                            </span>
                          </Link>
                        )}
                        <span className='text-xs text-gray-400'>
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-lg shadow-sm ${
                          isMine
                            ? 'bg-green-700 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none'
                        }`}
                      >
                        {messageContent}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />

        <div className='relative'>
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <motion.div
                className='cursor-pointer'
                onClick={() => setShowDogCard(!showDogCard)}
                animate={showDogCard ? { scale: 1.2 } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TooltipTrigger asChild>
                  <Image
                    src='/chat.webp'
                    alt='小狗聊天图片'
                    width={100}
                    height={100}
                    className='ml-[-20px]'
                  />
                </TooltipTrigger>
              </motion.div>
              <TooltipContent
                side='right'
                sideOffset={-28}
                align='center'
                className='z-50'
              >
                线条小狗帮我聊天
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AnimatePresence>
            {showDogCard && (
              <>
                <motion.div
                  animate={{ width: 'auto', opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className='absolute bottom-10 left-16 z-30 overflow-hidden'
                >
                  <Card className='p-4 shadow-lg border-green-200 w-[650px] max-h-[80vh] overflow-hidden'>
                    <CardContent className='p-2'>
                      {!streamResponse ? (
                        <>
                          <div className='flex items-center space-x-4'>
                            <Image
                              src='/chat.webp'
                              alt='小狗助手'
                              width={50}
                              height={50}
                              className='rounded-full'
                            />
                            <div>
                              <h3 className='font-medium'>线条小狗</h3>
                              <p className='text-sm text-gray-500'>AI助手</p>
                            </div>
                          </div>
                          <div className='mt-3 text-sm'>
                            <p>
                              哈喽，我是线条小狗，不知道怎么继续聊下去吗？让我来帮帮你吧。
                            </p>
                            <p className='text-xs text-gray-400 mt-1'>
                              (注意: 我会查看你们之前的聊天记录，介意就别了~)
                            </p>
                            <div className='flex justify-between mt-2'>
                              <Button
                                variant='outline'
                                onClick={() => resetAllStates()}
                              >
                                不需要了
                              </Button>
                              <Button
                                onClick={() => {
                                  const data =
                                    queryClient.getQueryData<ChatMessage[]>([
                                      'chatHistory',
                                      conversation.id,
                                    ]) ?? [];

                                  const input = data
                                    .slice(0, 10)
                                    .map((item) => ({
                                      user_id: item.sendId,
                                      lines: item.message,
                                    }));

                                  aiChat({
                                    params: {
                                      input,
                                      requester: userId ?? '',
                                    },
                                  });
                                }}
                              >
                                帮帮我们
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className='font-bold text-xl mb-3'>
                            情感分析及建议:
                          </p>
                          <ScrollArea className='h-[400px] pr-4'>
                            <div className='space-y-2'>
                              {isAiChatLoading &&
                              streamResponse.length === 0 ? (
                                <div className='flex justify-center py-2'>
                                  <div className='flex flex-col items-center'>
                                    <div className='w-6 h-6 border-3 border-green-200 border-t-green-500 rounded-full animate-spin'></div>
                                    <p className='text-gray-500 mt-2 text-xs'>
                                      思考中...
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="whitespace-pre-wrap break-words">
                                    <Markdown>{streamResponse}</Markdown>
                                  </div>
                                  {isAiChatLoading && (
                                    <span className='inline-block animate-pulse'>
                                      ▌
                                    </span>
                                  )}
                                </>
                              )}
                              <div className='flex justify-end mt-4'>
                                <Button
                                  variant='outline'
                                  onClick={() => {
                                    // 保存示例内容到临时变量
                                    const tempResponse = streamResponse;
                                    resetAllStates();
                                    
                                    // 提取示例内容并显示示例选项卡
                                    const examples = extractExamples(tempResponse);
                                    console.log('AI回复内容长度:', tempResponse.length);
                                    console.log('提取的示例数量:', examples.length);
                                    
                                    if (examples.length > 0) {
                                      setExampleTabContents(examples);
                                      setShowExampleTabs(true);
                                    }
                                  }}
                                >
                                  我知道了
                                </Button>
                              </div>
                            </div>
                          </ScrollArea>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 示例选项卡 - 放在输入框上方 */}
      {showExampleTabs && exampleTabContents.length > 0 && (
        <div className='px-4 py-2 border-t border-gray-100 bg-white'>
          <div className='flex items-start flex-wrap gap-2 w-full'>
            <ExampleTabs examples={exampleTabContents} onSelect={handleExampleSelect} />
          </div>
        </div>
      )}

      {/* 消息输入框 */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={handleTypingStatus}
        disabled={!isConnected || isSending}
        value={inputMessage}
        onChange={setInputMessage}
      />
    </div>
  );
};
