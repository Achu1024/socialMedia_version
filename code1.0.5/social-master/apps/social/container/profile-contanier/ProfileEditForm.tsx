'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Profile, useUpdateProfile, useChangePassword } from '@/http/useProfile';
import { AVATAR_URL } from '@/lib';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, FileText, Key, Loader2, User2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as z from 'zod';
import { Label } from '../../components/ui/label';
import Link from 'next/link';
import axios from 'axios';

const profileSchema = z.object({
  name: z.string().min(2, '名字至少需要2个字符'),
  bio: z.string().max(500, '简介不能超过500个字符').optional(),
  avatar: z.string().optional(),
  oldPassword: z.string().min(1, '请输入旧密码'),
  newPassword: z.string().min(6, '新密码至少需要6个字符'),
  confirmPassword: z.string().min(6, '确认密码至少需要6个字符'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新密码和确认密码不匹配",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  defaultValues?: Profile;
}

export const ProfileEditForm = ({ defaultValues }: ProfileEditFormProps) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const ref = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      bio: defaultValues?.bio || '',
      avatar: defaultValues?.avatar || '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // 如果有修改密码的数据，先处理密码修改
      if (data.oldPassword && data.newPassword) {
        try {
          await changePassword.mutateAsync({
            old_password: data.oldPassword,
            new_password: data.newPassword,
            confirm_password: data.confirmPassword,
          });
          return;
        } catch (error) {
          return;
        }
      }

      // 处理个人资料更新
      updateProfile.mutate(
        {
          ...data,
          avatar: avatarFile || undefined,
        },
        {
          onSuccess: () => {
            toast.success('更新成功');
            router.push('/profile');
          },
        }
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const avatarUrl = defaultValues?.avatar || AVATAR_URL;

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='relative w-32 h-32 mx-auto group'>
        <Image
          src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl}
          alt={defaultValues?.name || '用户头像'}
          fill
          className='object-cover rounded-full cursor-pointer'
          sizes='(max-width: 128px) 100vw, 128px'
        />
        <div
          onClick={() => ref.current?.click()}
          className='absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
        >
          <Camera className='w-6 h-6 text-white' />
        </div>
      </div>

      <input
        type='file'
        id='avatar-input'
        className='hidden'
        accept='image/*'
        onChange={handleAvatarChange}
        ref={ref}
      />
      <ScrollArea>
        <form onSubmit={form.handleSubmit(onSubmit)} className='mt-6 px-8'>
          <div className='space-y-6'>
            <Label
              htmlFor='name'
              className=' bg-background px-4 text-xs text-muted-foreground flex items-center gap-1 border-r border-gray-200 dark:border-gray-800'
            >
              <User2 className='w-3 h-3' />
              <p className='whitespace-nowrap'>名字</p>
            </Label>
            <div className='flex items-center gap-2 border  border-gray-200 dark:border-gray-800 rounded-2xl px-2 focus-within:border-blue-500 transition-all hover:border-blue-500/50'>
              <Input
                id='name'
                {...form.register('name')}
                placeholder='请输入你的名字'
                className='border-0 p-2 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50'
              />
              {form.formState.errors.name && (
                <p className='text-sm text-red-500 mt-1 flex items-center gap-1'>
                  <span className='inline-block w-1 h-1 rounded-full bg-red-500' />
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <Label
              htmlFor='bio'
              className='bg-background px-2 text-xs text-muted-foreground flex items-center gap-1 border-r border-gray-200 dark:border-gray-800'
            >
              <FileText className='w-3 h-3' />
              <p className='whitespace-nowrap'>个人简介</p>
            </Label>
            <div className=' flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-2xl px-2 focus-within:border-blue-500 transition-all hover:border-blue-500/50'>
              <Textarea
                id='bio'
                {...form.register('bio')}
                placeholder='介绍一下你自己'
                className='min-h-[120px] border-0 p-2 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50 resize-none'
              />
              {form.formState.errors.bio && (
                <p className='text-sm text-red-500 mt-1 flex items-center gap-1'>
                  <span className='inline-block w-1 h-1 rounded-full bg-red-500' />
                  {form.formState.errors.bio.message}
                </p>
              )}
            </div>

            <div className='border-t border-gray-200 dark:border-gray-800 pt-6 mt-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium'>修改密码</h3>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className='text-sm text-purple hover:text-purple-dark'
                >
                  {isChangingPassword ? '收起' : '修改密码'}
                </Button>
              </div>

              {isChangingPassword && (
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-2xl px-2 focus-within:border-blue-500 transition-all hover:border-blue-500/50'>
                    <Input
                      type='password'
                      {...form.register('oldPassword')}
                      placeholder='请输入旧密码'
                      className='border-0 p-2 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50'
                    />
                  </div>
                  {form.formState.errors.oldPassword && (
                    <p className='text-sm text-red-500 mt-1 flex items-center gap-1'>
                      <span className='inline-block w-1 h-1 rounded-full bg-red-500' />
                      {form.formState.errors.oldPassword.message}
                    </p>
                  )}

                  <div className='flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-2xl px-2 focus-within:border-blue-500 transition-all hover:border-blue-500/50'>
                    <Input
                      type='password'
                      {...form.register('newPassword')}
                      placeholder='请输入新密码'
                      className='border-0 p-2 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50'
                    />
                  </div>
                  {form.formState.errors.newPassword && (
                    <p className='text-sm text-red-500 mt-1 flex items-center gap-1'>
                      <span className='inline-block w-1 h-1 rounded-full bg-red-500' />
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}

                  <div className='flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-2xl px-2 focus-within:border-blue-500 transition-all hover:border-blue-500/50'>
                    <Input
                      type='password'
                      {...form.register('confirmPassword')}
                      placeholder='请确认新密码'
                      className='border-0 p-2 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50'
                    />
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className='text-sm text-red-500 mt-1 flex items-center gap-1'>
                      <span className='inline-block w-1 h-1 rounded-full bg-red-500' />
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 -mx-8 px-8 border-t mt-6'>
            <section className='flex items-center justify-between gap-4'>
              <Button variant='outline' asChild className='flex-1'>
                <Link href='/profile'>返回</Link>
              </Button>
              <Button
                type='submit'
                disabled={updateProfile.isPending || changePassword.isPending}
                className='flex-1 text-white font-medium'
              >
                {(updateProfile.isPending || changePassword.isPending) ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    保存中...
                  </>
                ) : (
                  '保存修改'
                )}
              </Button>
            </section>
          </div>
        </form>
        
      </ScrollArea>
    </div>
  );
};
