'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/lib/utils/validators';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password, rememberMe);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-6">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your AttendGuard account</p>
        </div>

        <div className="bg-[#111] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              icon={<Mail className="w-5 h-5" />}
              placeholder="name@company.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              icon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
