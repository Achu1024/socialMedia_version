'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Profile, useChangePassword } from '@/http/useProfile';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as z from 'zod';
import Link from 'next/link';

const profileSchema = z.object({
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
  const router = useRouter();
  const changePassword = useChangePassword();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // 处理密码修改
      await changePassword.mutateAsync({
        old_password: data.oldPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      });
    } catch (error: any) {
      toast.error(error.message || '密码修改失败');
    }
  };

  return (
    <div className='max-w-2xl mx-auto'>
      <ScrollArea>
        <form onSubmit={form.handleSubmit(onSubmit)} className='mt-6 px-8'>
          <div className='space-y-6'>
            {/* 密码修改 */}
            <div className='border-gray-200 dark:border-gray-800 pt-6 mt-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium'>修改密码</h3>
                <Key className='h-5 w-5 text-muted-foreground' />
              </div>

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
            </div>
          </div>

          <div className='sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 -mx-8 px-8 border-t mt-6'>
            <section className='flex items-center justify-between gap-4'>
              <Button variant='outline' asChild className='flex-1'>
                <Link href='/profile'>返回</Link>
              </Button>
              <Button
                type='submit'
                disabled={changePassword.isPending}
                className='flex-1 text-white font-medium'
              >
                {changePassword.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    修改中
                  </>
                ) : (
                  '修改密码'
                )}
              </Button>
            </section>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
};
