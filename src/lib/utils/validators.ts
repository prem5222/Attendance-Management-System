import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s-]{10,15}$/.test(val),
      'Invalid phone number'
    ),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const employeeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().optional(),
});

export const settingsSchema = z.object({
  checkInStart: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  checkInEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  lateThreshold: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  workingHours: z.number().min(1).max(24),
  companyName: z.string().min(1, 'Company name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type EmployeeFormData = z.infer<typeof employeeFormSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
