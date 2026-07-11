'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Shield, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/utils/validators';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await resetPassword(data.email);
      setIsSent(true);
    } catch (error) {
      // Error handled in hook
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
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">We'll send you instructions in email</p>
        </div>

        <div className="bg-[#111] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {isSent ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Email Sent</h3>
                <p className="text-gray-400 text-sm">
                  Check your inbox for a password reset link. It might take a few minutes to arrive.
                </p>
              </div>
              <Link href="/login" className="block w-full">
                <Button className="w-full" variant="secondary">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email Address"
                icon={<Mail className="w-5 h-5" />}
                placeholder="name@company.com"
                {...register('email')}
                error={errors.email?.message}
              />

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Send Reset Link
              </Button>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
