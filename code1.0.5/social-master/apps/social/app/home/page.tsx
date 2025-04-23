'use client';

import Emoji from '@/components/ChatEmoji';
import { PostItem } from '@/components/PostItem';
import Tiptap, { TiptapRef } from '@/components/Rich/Tiptap';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// import { Textarea } from '@/components/ui/textarea';
import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { UserAvatar } from '@/container/profile-contanier/UserAvatar';
import { useProfile } from '@/http/useAuth';
import { useCreatePost } from '@/http/usePost';
import { useSearchPostsPaginated } from '@/http/useSearch';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Smile, X, ArrowLeft, Lock, Unlock } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { PhotoProvider, PhotoView } from 'react-photo-view';

// 图片处理相关配置
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_COUNT = 9; // 最多上传9张图片
const COMPRESSION_QUALITY = 0.7; // 压缩质量
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]; // 允许的图片类型

// 压缩图片函数
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 添加超时机制
    const timeoutId = setTimeout(() => {
      reject(new Error('图片压缩超时'));
    }, 40000); // 40秒超时
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = document.createElement('img'); // 修复：使用document.createElement代替new HTMLImageElement
      img.src = event.target?.result as string;
      img.onload = () => {
        // 清除超时
        clearTimeout(timeoutId);
        
        // 确定压缩后的尺寸
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200; // 最大尺寸

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建画布上下文'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob conversion failed'));
                return;
              }
              // 创建新的File对象
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            COMPRESSION_QUALITY
          );
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Image loading error'));
      };
    };
    reader.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('File reading error'));
    };
  });
};

const HomePage = () => {
  const [newPost, setNewPost] = useState('');
  const [postImages, setPostImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<TiptapRef | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // const { data: posts, isLoading } = useSearch('');
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const router = useRouter();
  const createPost = useCreatePost();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const {
    data: posts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchPostsPaginated();

  // 设置 IntersectionObserver 监听底部元素
  useEffect(() => {
    const loadMoreCallback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    if (loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(loadMoreCallback, {
        root: null, // 使用视口作为根
        rootMargin: '0px',
        threshold: 0.1, // 当 10% 的目标元素可见时触发回调
      });

      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    createPost.mutate(
      {
        body: newPost,
        attachments: postImages.length > 0 ? postImages : undefined,
        is_private: isPrivate,
      },
      {
        onSuccess: (data) => {
          setNewPost('');
          setPostImages([]);
          setImagePreviewUrls([]);
          setIsPrivate(false);
          queryClient.invalidateQueries({
            queryKey: ['search_posts_paginated', ''],
          });
          if (editorRef.current && editorRef.current.editor) {
            editorRef.current.editor.commands.clearContent();
          }
          toast.success('发布成功！');
        },
        onError: (error) => {
          toast.error('发布失败，请稍后重试');
        },
      }
    );
  };

  // 处理编辑器内容更新
  const handleEditorUpdate = (content: string) => {
    setNewPost(content);
  };

  // 处理图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查是否超过最大数量限制
    if (postImages.length + files.length > MAX_IMAGE_COUNT) {
      toast.error(`最多只能上传${MAX_IMAGE_COUNT}张图片`);
      return;
    }

    setIsProcessing(true);

    try {
      const newImages: File[] = [];
      const newPreviewUrls: string[] = [];

      // 处理每一个文件
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 文件类型检查
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error(
            `${file.name} 格式不支持，请上传 JPG、PNG、GIF 或 WebP 格式图片`
          );
          continue;
        }

        // 文件大小检查
        if (file.size > MAX_FILE_SIZE) {
          toast(`图片 ${file.name} 较大，正在压缩...`);
          try {
            // 尝试压缩图片
            const compressedFile = await compressImage(file);
            if (compressedFile.size > MAX_FILE_SIZE) {
              toast.error(
                `图片 ${file.name} 太大，即使压缩后仍超过 ${
                  MAX_FILE_SIZE / 1024 / 1024
                }MB`
              );
              continue;
            }
            newImages.push(compressedFile);
            newPreviewUrls.push(URL.createObjectURL(compressedFile));
            toast.success(`图片 ${file.name} 压缩成功`);
          } catch (error) {
            // 处理错误，包括超时错误
            if (error instanceof Error && error.message === '图片压缩超时') {
              toast.error(`图片 ${file.name} 压缩超时，请尝试更小的图片`);
            } else {
              toast.error(`图片 ${file.name} 处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
            continue;
          }
        } else {
          // 小于限制大小的图片直接添加
          newImages.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
        }
      }

      // 更新状态
      setPostImages((prev) => [...prev, ...newImages]);
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    } catch (error) {
      toast.error('处理图片时出错，请重试');
      console.error('图片处理错误:', error);
    } finally {
      setIsProcessing(false);
      // 清空input值，允许再次选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除单个图片
  const removeImage = (index: number) => {
    const newImages = [...postImages];
    const newPreviewUrls = [...imagePreviewUrls];

    // 清除预览URL以避免内存泄漏
    URL.revokeObjectURL(newPreviewUrls[index]);

    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);

    setPostImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  // 清除所有图片选择
  const clearAllImages = () => {
    // 清除所有预览URL
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

    setPostImages([]);
    setImagePreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isQuery = query !== '';
  return (
    <>
      {/* 顶部导航 */}
      <div className='sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 z-10 shadow-sm'>
        <div className='flex items-center p-4 max-w-4xl mx-auto'>
          {isQuery ? (
            <div className='flex items-center gap-2'>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-primary/10 transition-all rounded-full"
                onClick={() => router.push('/home')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className='text-lg font-bold text-primary'>
                #{query}
              </h1>
            </div>
          ) : (
            <h1 className='text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'>
              首页
            </h1>
          )}
        </div>
      </div>

      {/* 发推框 */}
      {!isQuery && (
        <div className='p-4 border-b border-border/40 hover:bg-accent/5 transition-colors'>
          <div className='flex gap-4 max-w-4xl mx-auto'>
            <UserAvatar
              src={profile?.avatar}
              alt={profile?.name || '用户'}
              size='md'
              className='transition-transform hover:scale-105'
            />
            <div className='flex-1 rounded-lg'>
            
              <Tiptap ref={editorRef} onContentUpdate={handleEditorUpdate} />
              <div className='text-xs text-muted-foreground mb-2 mt-2'>
                <span className='text-primary font-medium '>#话题</span> - 使用 # 符号发布你感兴趣的话题
              </div>
              {/* 显示图片预览 - 多图布局 */}
              {imagePreviewUrls.length > 0 && (
                <div className='mt-3'>
                  <div className={cn(
                    'grid gap-3',
                    imagePreviewUrls.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                    imagePreviewUrls.length <= 3 ? 'grid-cols-3' :
                    imagePreviewUrls.length === 4 ? 'grid-cols-2' :
                    imagePreviewUrls.length <= 6 ? 'grid-cols-3 grid-rows-2' :
                    'grid-cols-3 grid-rows-3'
                  )}>
                    {imagePreviewUrls.map((url, index) => (
                      <div
                        className='relative bg-black/5 border border-border/40 rounded-xl flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors aspect-square'
                        key={index}
                      >
                        <PhotoProvider>
                          <PhotoView src={url}>
                            <div className="w-full h-full overflow-hidden">
                              <Image
                                src={url}
                                width={200}
                                height={200}
                                alt='上传预览'
                                className='cursor-pointer object-cover w-full h-full hover:scale-105 transition-transform'
                              />
                            </div>
                          </PhotoView>
                        </PhotoProvider>
                        <button
                          onClick={() => removeImage(index)}
                          className='absolute cursor-pointer top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 z-10 transition-colors'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={clearAllImages}
                    className='mt-2 text-sm text-muted-foreground hover:text-primary transition-colors'
                  >
                    清除全部图片
                  </button>
                </div>
              )}

              <div className='flex items-center justify-between mt-4 pt-4 border-t border-border/40'>
                <div className='flex gap-2'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className={`text-primary cursor-pointer hover:bg-primary/10 transition-all rounded-full ${
                            postImages.length >= MAX_IMAGE_COUNT
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:scale-110 active:scale-95'
                          }`}
                          onClick={() => {
                            if (
                              postImages.length < MAX_IMAGE_COUNT &&
                              !isProcessing
                            ) {
                              fileInputRef.current?.click();
                            } else if (postImages.length >= MAX_IMAGE_COUNT) {
                              toast.error(
                                `最多只能上传${MAX_IMAGE_COUNT}张图片`
                              );
                            }
                          }}
                          disabled={
                            postImages.length >= MAX_IMAGE_COUNT || isProcessing
                          }
                        >
                          {isProcessing ? (
                            <Loader2 className='h-5 w-5 animate-spin' />
                          ) : (
                            <ImageIcon className='h-5 w-5' />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          插入图片 ({postImages.length}/{MAX_IMAGE_COUNT})
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* 隐藏的文件输入 */}
                  <input
                    type='file'
                    ref={fileInputRef}
                    className='hidden'
                    accept='image/*'
                    onChange={handleImageSelect}
                    multiple
                  />

                  <TooltipProvider>
                    <Tooltip>
                      <Emoji
                        onClick={(e) => {
                          // 将表情插入到编辑器
                          if (editorRef.current && editorRef.current.editor) {
                            editorRef.current.editor.commands.insertContent(
                              e.native
                            );
                          }
                        }}
                      >
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-primary hover:bg-primary/10 transition-all rounded-full hover:scale-110 active:scale-95'
                          >
                            <Smile className='h-5 w-5' />
                          </Button>
                        </TooltipTrigger>
                      </Emoji>
                      <TooltipContent>
                        <p>插入表情</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className={`hover:bg-primary/10 transition-colors rounded-full ${
                            isPrivate ? 'text-primary' : 'text-muted-foreground'
                          }`}
                          onClick={() => setIsPrivate(!isPrivate)}
                        >
                          {isPrivate ? (
                            <Lock className='h-5 w-5' />
                          ) : (
                            <Unlock className='h-5 w-5' />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPrivate ? '私密帖子' : '公开帖子'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={
                    createPost.isPending || !newPost.trim() || isProcessing
                  }
                  className={cn(
                    'shadow-sm hover:shadow-md transition-all px-6 rounded',
                    (!newPost.trim() || isProcessing) &&
                      'opacity-50 cursor-not-allowed',
                    newPost.trim() &&
                      !isProcessing &&
                      'hover:scale-105 active:scale-95 bg-gradient-to-r from-primary to-primary/80'
                  )}
                >
                  {createPost.isPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    '发布'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 帖子列表 */}
      <div className='divide-y divide-border/40 max-w-4xl mx-auto'>
        {isLoading ? (
          <div className='flex justify-center items-center py-12'>
            <div className='flex flex-col items-center gap-3'>
              <Loader2 className='h-10 w-10 animate-spin text-primary' />
              <p className='text-muted-foreground animate-pulse'>加载中...</p>
            </div>
          </div>
        ) : (
          posts?.pages.map((page) =>
            page.results.map((post) => <PostItem key={post.id} post={post} />)
          )
        )}

        {/* 加载更多指示器 */}
        <div ref={loadMoreRef} className='w-full py-4'>
          {isFetchingNextPage && (
            <div className='flex justify-center items-center py-4'>
              <Loader2 className='h-6 w-6 animate-spin text-primary' />
            </div>
          )}
        </div>
        <div className='flex justify-center items-center py-4'>
          {hasNextPage ? (
            <span className='text-sm text-muted-foreground hover:text-primary transition-colors'>
              加载更多
            </span>
          ) : (
            <span className='text-sm text-muted-foreground opacity-70'>
              没有更多了
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default withAuth(HomePage);

