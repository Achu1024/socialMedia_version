'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAdminCreateUser } from '@/http/useAdmin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

// 表单验证规则
const formSchema = z.object({
  name: z.string().min(2, '名称至少需要2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
  bio: z.string().optional(),
  is_admin: z.boolean().default(false),
});

type UserFormValues = z.infer<typeof formSchema>;

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateUserModal = ({ open, onOpenChange }: CreateUserModalProps) => {
  const createUser = useAdminCreateUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      bio: '',
      is_admin: false,
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      await createUser.mutateAsync(values);
      form.reset(); // 重置表单
      onOpenChange(false);
      toast.success('用户创建成功');
    } catch (error) {
      toast.error('用户创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] rounded-xl p-6'>
        <DialogHeader className='mb-4'>
          <DialogTitle className='text-xl font-bold text-gray-800'>
            创建新用户
          </DialogTitle>
          <DialogDescription className='text-gray-600 mt-1'>
            添加一个新用户到系统中，填写以下信息以创建账户
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-gray-700'>用户名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入用户名'
                      {...field}
                      className='rounded-lg border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple transition-all'
                    />
                  </FormControl>
                  <FormMessage className='text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-gray-700'>邮箱地址</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入邮箱地址'
                      type='email'
                      {...field}
                      className='rounded-lg border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple transition-all'
                    />
                  </FormControl>
                  <FormMessage className='text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-gray-700'>密码</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入密码'
                      type='password'
                      {...field}
                      className='rounded-lg border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple transition-all'
                    />
                  </FormControl>
                  <FormDescription className='text-xs text-gray-500'>
                    密码至少需要6个字符
                  </FormDescription>
                  <FormMessage className='text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='bio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-gray-700'>个人简介</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='请输入个人简介（选填）'
                      {...field}
                      className='rounded-lg border-gray-200 focus:border-purple focus:ring-1 focus:ring-purple transition-all resize-none min-h-[80px]'
                    />
                  </FormControl>
                  <FormMessage className='text-red-500' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='is_admin'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-gray-200 p-3 shadow-sm'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className='data-[state=checked]:bg-purple data-[state=checked]:border-purple'
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-gray-700'>
                      是否设为管理员
                    </FormLabel>
                    <FormDescription className='text-xs text-gray-500'>
                      管理员可以管理所有用户和内容
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className='pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                className='rounded-lg border-gray-200 hover:bg-gray-50 transition-colors'
              >
                取消
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='rounded-lg bg-purple hover:bg-purple-contrast transition-colors'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    创建中...
                  </>
                ) : (
                  '创建用户'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
