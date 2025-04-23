import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TokenResponse, useSignup } from '@/http/useAuth';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

const signupSchema = z
  .object({
    username: z.string().min(2, '用户名至少2个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码至少6个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm({
  onSuccess,
}: {
  onSuccess: (data: TokenResponse) => void;
}) {
  const { mutate: signup, isPending } = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    signup(
      {
        name: data.username,
        email: data.email,
        password1: data.password,
        password2: data.confirmPassword,
      },
      {
        onSuccess: (data) => {
          onSuccess(data.token);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='space-y-4'>
        <div>
          <Label
            htmlFor='username'
            className='text-sm font-medium text-gray-700 dark:text-gray-300 block'
          >
            用户名
          </Label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <FiUser className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            </div>
            <Input
              {...register('username')}
              type='text'
              id='username'
              placeholder='用户名'
              className='block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
            />
          </div>
          {errors.username && (
            <p className='text-sm text-red-500 mt-1'>
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
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

        <div>
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
              placeholder='密码'
              className='block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
            />
          </div>
          {errors.password && (
            <p className='text-sm text-red-500 mt-1'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor='confirmPassword'
            className='text-sm font-medium text-gray-700 dark:text-gray-300 block'
          >
            确认密码
          </Label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <FiLock className='h-5 w-5 text-gray-400 dark:text-gray-500' />
            </div>
            <Input
              {...register('confirmPassword')}
              type='password'
              id='confirmPassword'
              placeholder='确认密码'
              className='block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
            />
          </div>
          {errors.confirmPassword && (
            <p className='text-sm text-red-500 mt-1'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type='submit'
        disabled={isPending}
        className='w-full  text-white mt-2'
      >
        {isPending ? '注册中...' : '注册'}
      </Button>
    </form>
  );
}
