import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconEye, IconNonEye } from '@/assets/icons';
import { Input } from '@/components/ui/input';
import { PASSWORD_TYPE, TEXT_TYPE } from '@/configs/consts';
import { AppDispatch } from '@/core/store/store';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { resetUserPassword } from '@/redux/slices/adminSlices/user.slice';

export interface ResetUserPayload {
  userId: string;
  password: string;
  confirmPassword: string;
  forceSignOut?: boolean;
}

export interface ResetUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ResetUserPayload) => Promise<void> | void;
  user: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
    createdAt?: string;
    isActive?: boolean;
    isApproved?: boolean;
  };
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

const ResetPasswordSchema = z
  .object({
    user_password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .regex(
        passwordRegex,
        'Password must be at least 6 characters long, contain at least one uppercase letter and one number',
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    force_sign_out: z.boolean().optional().default(true),
  })
  .refine(v => v.confirm_password === v.user_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof ResetPasswordSchema>;

type Strength = 'weak' | 'medium' | 'strong';
function getPasswordStrength(pw: string): Strength {
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return s <= 2 ? 'weak' : s <= 4 ? 'medium' : 'strong';
}

export default function ResetPasswordModal({ open, onClose, user }: ResetUserModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [pwdStrength, setPwdStrength] = useState<Strength>('weak');

  const defaultValues: FormValues = {
    user_password: '',
    confirm_password: '',
    force_sign_out: true,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues,
    shouldFocusError: false,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open]);

  if (!open) return null;

  const isErr = (name: keyof FormValues) =>
    (form.formState.touchedFields[name] || form.formState.submitCount > 0) &&
    !!form.formState.errors[name];

  const handleSubmit = async (values: FormValues) => {
    await dispatch(
      resetUserPassword({
        userId: user.id,
        newPassword: values.user_password,
        confirmPassword: values.confirm_password,
      }),
    ).unwrap();

    toast.success('Password has been reset');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[520px] max-w-full mx-4">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Reset Password</h2>

        <div className="grid grid-cols-2 gap-3 mb-5 text-sm bg-slate-50 rounded-lg p-3">
          <div>
            <div className="text-slate-500">Full name</div>
            <div className="font-medium">{user.fullName}</div>
          </div>
          <div>
            <div className="text-slate-500">Email</div>
            <div className="font-medium break-all">{user.email}</div>
          </div>
          <div>
            <div className="text-slate-500">Role</div>
            <div className="font-medium capitalize">{user.role}</div>
          </div>
          {typeof user.isActive === 'boolean' && (
            <div>
              <div className="text-slate-500">Status</div>
              <div className={`font-semibold ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user.isActive ? 'Active' : 'Disabled'}
              </div>
            </div>
          )}
          {['instructor', 'teacher'].includes((user.role || '').toLowerCase()) &&
            typeof user.isApproved === 'boolean' && (
              <div>
                <div className="text-slate-500">Instructor approved</div>
                <div
                  className={`font-medium ${user.isApproved ? 'text-green-600' : 'text-slate-600'}`}
                >
                  {user.isApproved ? 'Yes' : 'No'}
                </div>
              </div>
            )}
        </div>

        {/* Form fields */}
        <form
          onSubmit={form.handleSubmit(async v => {
            try {
              await handleSubmit(v);
            } catch (err: any) {
              form.setError('confirm_password', { message: err?.message || 'Reset failed' });
            }
          })}
          className="space-y-4"
        >
          {/* New password */}
          <div className="relative group">
            <Input
              id="user_password"
              autoComplete="new-password"
              type={showPwd ? TEXT_TYPE : PASSWORD_TYPE}
              placeholder=" "
              className="peer focus:border-blue-600 pr-10"
              icon={showPwd ? <IconEye /> : <IconNonEye />}
              iconOnClick={() => setShowPwd(v => !v)}
              isError={isErr('user_password')}
              errorMessage={
                isErr('user_password')
                  ? form.formState.errors.user_password?.message?.toString()
                  : undefined
              }
              aria-invalid={isErr('user_password') ? 'true' : 'false'}
              {...form.register('user_password', {
                onChange: e => setPwdStrength(getPasswordStrength(e.target.value)),
              })}
            />
            <label
              htmlFor="user_password"
              className={[
                'pointer-events-none absolute left-3 bg-white px-1 transition',
                ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',
                form.watch('user_password') || isErr('user_password')
                  ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                  : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                isErr('user_password')
                  ? 'text-red-500'
                  : 'text-slate-500 group-focus-within:text-blue-600',
              ].join(' ')}
            >
              Password
            </label>

            {/* Strength bar */}
            {form.watch('user_password') && (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-sm ${
                        pwdStrength === 'weak' && i === 0
                          ? 'bg-red-500'
                          : pwdStrength === 'medium' && i <= 2
                            ? 'bg-yellow-500'
                            : pwdStrength === 'strong'
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="relative group">
            <Input
              id="confirm_password"
              autoComplete="new-password"
              type={showPwd2 ? TEXT_TYPE : PASSWORD_TYPE}
              placeholder=" "
              className="peer focus:border-blue-600 pr-10"
              icon={showPwd2 ? <IconEye /> : <IconNonEye />}
              iconOnClick={() => setShowPwd2(v => !v)}
              isError={isErr('confirm_password')}
              errorMessage={
                isErr('confirm_password')
                  ? form.formState.errors.confirm_password?.message?.toString()
                  : undefined
              }
              aria-invalid={isErr('confirm_password') ? 'true' : 'false'}
              {...form.register('confirm_password')}
            />
            <label
              htmlFor="confirm_password"
              className={[
                'pointer-events-none absolute left-3 bg-white px-1 transition',
                ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',
                form.watch('confirm_password') || isErr('confirm_password')
                  ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                  : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                isErr('confirm_password')
                  ? 'text-red-500'
                  : 'text-slate-500 group-focus-within:text-blue-600',
              ].join(' ')}
            >
              Confirm password
            </label>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
              onClick={() => {
                form.reset(defaultValues);
                onClose();
              }}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
