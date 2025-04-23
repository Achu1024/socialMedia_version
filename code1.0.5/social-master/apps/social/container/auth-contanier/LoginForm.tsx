'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '@/http/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FiMail, FiLock } from 'react-icons/fi';

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='space-y-6 w-full max-w-sm '
    >
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label
            htmlFor='email'
            className='text-sm font-medium text-gray-700 dark:text-gray-300 block'
          >
            邮箱
          </Label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <FiMail className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            </div>
            <Input
              {...register('email')}
              type='email'
              id='email'
              className='block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
              placeholder='请输入邮箱'
            />
          </div>
          {errors.email && (
            <p className='text-sm text-red-500 mt-1'>{errors.email.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label
            htmlFor='password'
            className='text-sm font-medium text-gray-700 dark:text-gray-300 block'
          >
            密码
          </Label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <FiLock className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            </div>
            <Input
              {...register('password')}
              type='password'
              id='password'
              className='block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent  transition-colors duration-200'
              placeholder='请输入密码'
            />
          </div>
          {errors.password && (
            <p className='text-sm text-red-500 mt-1'>
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className='flex items-center justify-between mt-6'>
        <div className='flex items-center'>
          <input
            id='remember-me'
            name='remember-me'
            type='checkbox'
            className='h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded transition-colors duration-200'
          />
          <label
            htmlFor='remember-me'
            className='ml-2 block text-sm text-gray-700 dark:text-gray-300'
          >
            记住我
          </label>
        </div>

        {/* <div className='text-sm'>
          <a href='#' className='font-medium  transition-colors duration-200'>
            忘记密码？
          </a>
        </div> */}
      </div>

      <Button
        type='submit'
        disabled={isPending}
        className='w-full py-3 px-4 text-white text-base font-semibold rounded-full shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6'
      >
        {isPending ? (
          <div className='flex items-center justify-center'>
            <svg
              className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            登录中...
          </div>
        ) : (
          '登录'
        )}
      </Button>
    </form>
  );
}
