import { z } from 'zod';

export const RegisterSchema = z
  .object({
    fullname: z.string().min(1, 'Full name is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .regex(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid email format'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
        'Password must be at least 6 characters long, contain at least one uppercase letter and one number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    // role: z.enum(['student', 'instructor'], {
    //   required_error: 'Role is required',
    // }),
    // date_of_birth: z.string().min(1, 'Date of birth is required'),
    code: z.string().min(1, 'Captcha code is required'),
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^(0|\+84)\d{9}$/, 'Phone number must be 10 digits and start with 0 or +84'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
