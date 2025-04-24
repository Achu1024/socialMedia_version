import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TokenResponse, useSignup, useSendEmailCode, useVerifyEmailCode } from '@/http/useAuth';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { FiMail, FiLock, FiUser, FiCheck } from 'react-icons/fi';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

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
  const { mutate: sendEmailCode, isPending: isSendingCode } = useSendEmailCode();
  const { mutate: verifyEmailCode, isPending: isVerifyingCode } = useVerifyEmailCode();
  
  // 验证码相关状态
  const [isVerified, setIsVerified] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // 处理发送验证码
  const handleSendEmailCode = async () => {
    // 先验证邮箱格式
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;

    const email = getValues('email');
    setVerificationEmail(email);
    
    // 发送验证码
    sendEmailCode(
      { email },
      {
        onSuccess: (data) => {
          if (data.success) {
            // 打开验证码对话框
            setVerificationDialogOpen(true);
            // 设置倒计时
            setCountdown(60);
            const timer = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(timer);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        },
      }
    );
  };

  // 处理验证码验证
  const handleVerifyCode = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('请输入完整的验证码');
      return;
    }

    verifyEmailCode(
      { email: verificationEmail, code: verificationCode },
      {
        onSuccess: (data) => {
          if (data.success) {
            setIsVerified(true);
            setVerificationDialogOpen(false);
          }
        },
      }
    );
  };

  const onSubmit = (data: SignupFormValues) => {
    if (!isVerified) {
      toast.error('请先验证邮箱');
      return;
    }

    signup(
      {
        name: data.username,
        email: data.email,
        password1: data.password,
        password2: data.confirmPassword,
        is_verified: isVerified,
      },
      {
        onSuccess: (data) => {
          onSuccess(data.token);
        },
      }
    );
  };

  return (
    <>
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
                disabled={isVerified}
                className='block w-full pl-10 pr-24 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
              placeholder='请输入邮箱'
            />
              {isVerified ? (
                <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center text-green-500'>
                  <FiCheck className='mr-1' />
                  <span className='text-xs'>已验证</span>
                </div>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleSendEmailCode}
                  disabled={isSendingCode || countdown > 0}
                  className='absolute right-2 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 h-8 text-primary'
                >
                  {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                </Button>
              )}
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
          disabled={isPending || !isVerified}
          className='w-full text-white mt-2'
      >
        {isPending ? '注册中...' : '注册'}
      </Button>
    </form>

      {/* 验证码对话框 */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className='sm:max-w-[400px] rounded-lg'>
          <DialogHeader>
            <DialogTitle className='text-center text-xl font-semibold'>邮箱验证</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 pt-4'>
            <p className='text-sm text-center text-gray-600'>
              验证码已发送至邮箱：{verificationEmail}
            </p>
            <div className='space-y-2'>
              <Label htmlFor='verificationCode'>验证码</Label>
              <Input
                id='verificationCode'
                type='text'
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder='请输入6位验证码'
                className='text-center text-lg tracking-widest'
              />
            </div>
          </div>
          <DialogFooter className='flex flex-col sm:flex-row sm:justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setVerificationDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              type='button'
              onClick={handleVerifyCode}
              disabled={isVerifyingCode || verificationCode.length !== 6}
            >
              {isVerifyingCode ? '验证中...' : '验证'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
