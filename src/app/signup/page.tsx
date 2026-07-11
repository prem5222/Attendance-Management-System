'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signupSchema, SignupFormData } from '@/lib/utils/validators';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch('password', '');

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 7) strength += 25;
    if (pass.match(/[A-Z]/)) strength += 25;
    if (pass.match(/[0-9]/)) strength += 25;
    if (pass.match(/[^A-Za-z0-9]/)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength(password);
  
  const getStrengthColor = (val: number) => {
    if (val === 0) return 'bg-gray-700';
    if (val <= 25) return 'bg-red-500';
    if (val <= 50) return 'bg-orange-500';
    if (val <= 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      await signup(data.email, data.password, data.name);
      router.push('/login');
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
        className="w-full max-w-md relative z-10 py-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-6">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join AttendGuard today</p>
        </div>

        <div className="bg-[#111] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Full Name"
              icon={<User className="w-5 h-5" />}
              placeholder="John Doe"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Email Address"
              icon={<Mail className="w-5 h-5" />}
              placeholder="name@company.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <Input
                label="Password"
                type="password"
                icon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
              
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`} 
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    {strength === 100 ? 'Strong' : strength >= 50 ? 'Medium' : 'Weak'}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              icon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
