import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { RegisterSchema } from '@/core/zod';
import { authApi } from '@/core/services/auth.service';
import { IconEye, IconNonEye } from '@/assets/icons';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PASSWORD_TYPE, TEXT_TYPE } from '@/configs/consts';
import { toast } from 'react-toastify';

interface RoleOption {
  label: string;
  value: 'student' | 'instructor';
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (user: any) => void;
  roleOptions?: RoleOption[];
}

type FormValues = z.infer<typeof RegisterSchema>;

export default function UserFormModal({
  open,
  onClose,
  onCreated,
  roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Instructor', value: 'instructor' },
  ],
}: Props) {
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const [roleFocused, setRoleFocused] = useState(false);

  // password strength
  type Strength = 'weak' | 'medium' | 'strong';
  const [pwdStrength, setPwdStrength] = useState<Strength>('weak');

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

  const defaultValues = useMemo<FormValues>(
    () =>
      ({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: '',
        code: '',
        phoneNumber: '',
      }) as FormValues,
    [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues,
    shouldFocusError: false,
    mode: 'onSubmit',
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return authApi.register(data as any);
    },
    onSuccess: (res: any) => {
      onCreated?.(res?.user ?? res);
      form.reset(defaultValues);
      onClose();
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const status = err?.response?.status;

      const fieldErrors = data?.errors || data?.field_errors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          const map: Record<string, keyof FormValues> = {
            fullname: 'fullname',
            full_name: 'fullname',
            email: 'email',
            password: 'password',
            confirmPassword: 'confirmPassword',
            confirm_password: 'confirmPassword',
            code: 'code',
            captcha_code: 'code',
            phoneNumber: 'phoneNumber',
            phone_number: 'phoneNumber',
          };

          const key = map[field] ?? (field as keyof FormValues);
          form.setError(key, { message: String(message) });
        });
        return;
      }

      if (status === 409 || data?.code === 'EMAIL_EXISTS') {
        form.setError('email', { message: data?.message || 'Email already exists' });
        return;
      }

      form.setError('root' as any, {
        message: data?.message || 'An error occurred. Please try again.',
      });
    },
  });

  const onSubmit = async (values: FormValues) => {
    await registerMutation.mutateAsync(values);
    toast.success('User created');
  };

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, form, defaultValues]);

  const handleCancel = () => {
    form.reset(defaultValues);
    onClose();
  };

  if (!open) return null;

  const isErr = (name: keyof FormValues) =>
    ((form.formState.touchedFields as any)[name] || form.formState.submitCount > 0) &&
    !!form.formState.errors[name];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[520px] max-w-full mx-4">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Add User</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => {
                const showErr = isErr('fullname');
                const shouldFloat = !!form.watch('fullname') || showErr;
                return (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          {...field}
                          id="fullname"
                          placeholder=" "
                          className="peer focus:border-blue-600"
                          isError={showErr}
                          errorMessage={
                            showErr
                              ? form.formState.errors.fullname?.message?.toString()
                              : undefined
                          }
                        />
                        <label
                          htmlFor="captcha_code"
                          className={[
                            'pointer-events-none absolute left-5 bg-white px-1 transition',
                            ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                            shouldFloat
                              ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                              : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                            'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                            showErr
                              ? 'text-red-500'
                              : 'text-slate-500 group-focus-within:text-blue-600',
                          ].join(' ')}
                        >
                          Full Name
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                const showErr = isErr('email');
                const shouldFloat = !!form.watch('email') || showErr;
                return (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          {...field}
                          id="email"
                          type="text"
                          inputMode="email"
                          placeholder=" "
                          autoComplete="off"
                          className="peer focus:border-blue-600"
                          isError={showErr}
                          errorMessage={
                            showErr ? form.formState.errors.email?.message?.toString() : undefined
                          }
                          aria-invalid={showErr ? 'true' : 'false'}
                        />
                        <label
                          htmlFor="captcha_code"
                          className={[
                            'pointer-events-none absolute left-5 bg-white px-1 transition',
                            ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                            shouldFloat
                              ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                              : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                            'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                            showErr
                              ? 'text-red-500'
                              : 'text-slate-500 group-focus-within:text-blue-600',
                          ].join(' ')}
                        >
                          Email
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                const showErr = isErr('password');
                const shouldFloat = !!form.watch('password') || showErr;
                return (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          {...field}
                          id="password"
                          autoComplete="new-password"
                          type={showPwd ? TEXT_TYPE : PASSWORD_TYPE}
                          placeholder=" "
                          className="peer focus:border-blue-600 pr-10"
                          icon={showPwd ? <IconEye /> : <IconNonEye />}
                          iconOnClick={() => setShowPwd(v => !v)}
                          isError={showErr}
                          errorMessage={
                            showErr
                              ? form.formState.errors.password?.message?.toString()
                              : undefined
                          }
                          onChange={e => {
                            const v = e.target.value;
                            field.onChange(v);
                            setPwdStrength(getPasswordStrength(v));
                          }}
                          aria-invalid={showErr ? 'true' : 'false'}
                        />
                        <label
                          htmlFor="captcha_code"
                          className={[
                            'pointer-events-none absolute left-5 bg-white px-1 transition',
                            ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                            shouldFloat
                              ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                              : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                            'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                            showErr
                              ? 'text-red-500'
                              : 'text-slate-500 group-focus-within:text-blue-600',
                          ].join(' ')}
                        >
                          Password
                        </label>

                        {form.watch('password') && (
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
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => {
                const showErr = isErr('confirmPassword');
                const shouldFloat = !!form.watch('confirmPassword') || showErr;
                return (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          {...field}
                          id="confirmPassword"
                          autoComplete="new-password"
                          type={showPwd2 ? TEXT_TYPE : PASSWORD_TYPE}
                          placeholder=" "
                          className="peer focus:border-blue-600 pr-10"
                          icon={showPwd2 ? <IconEye /> : <IconNonEye />}
                          iconOnClick={() => setShowPwd2(v => !v)}
                          isError={showErr}
                          errorMessage={
                            showErr
                              ? form.formState.errors.confirmPassword?.message?.toString()
                              : undefined
                          }
                          aria-invalid={showErr ? 'true' : 'false'}
                        />
                        <label
                          htmlFor="captcha_code"
                          className={[
                            'pointer-events-none absolute left-5 bg-white px-1 transition',
                            ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                            shouldFloat
                              ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                              : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                            'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                            showErr
                              ? 'text-red-500'
                              : 'text-slate-500 group-focus-within:text-blue-600',
                          ].join(' ')}
                        >
                          Confirm Password
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => {
                const showErr = isErr('phoneNumber');
                const shouldFloat = !!form.watch('phoneNumber') || showErr;
                return (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          {...field}
                          id="phoneNumber"
                          type="text"
                          placeholder=" "
                          className="peer focus:border-blue-600"
                          isError={showErr}
                          errorMessage={
                            showErr
                              ? form.formState.errors.phoneNumber?.message?.toString()
                              : undefined
                          }
                          aria-invalid={showErr ? 'true' : 'false'}
                        />
                        <label
                          htmlFor="captcha_code"
                          className={[
                            'pointer-events-none absolute left-5 bg-white px-1 transition',
                            ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                            shouldFloat
                              ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                              : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                            'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                            showErr
                              ? 'text-red-500'
                              : 'text-slate-500 group-focus-within:text-blue-600',
                          ].join(' ')}
                        >
                          Phone Number
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            {/* Code (captcha/verification) */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => {
                const showErr = isErr('code');
                const shouldFloat = !!form.watch('code') || showErr;
                return (
                  <FormItem>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          {...field}
                          id="code"
                          type="text"
                          placeholder=" "
                          className="peer focus:border-blue-600"
                          isError={showErr}
                          errorMessage={
                            showErr ? form.formState.errors.code?.message?.toString() : undefined
                          }
                          aria-invalid={showErr ? 'true' : 'false'}
                        />
                        <label
                          htmlFor="captcha_code"
                          className={[
                            'pointer-events-none absolute left-5 bg-white px-1 transition',
                            ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                            shouldFloat
                              ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                              : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                            'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                            showErr
                              ? 'text-red-500'
                              : 'text-slate-500 group-focus-within:text-blue-600',
                          ].join(' ')}
                        >
                          Code
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting || registerMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={form.formState.isSubmitting || registerMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-2 rounded"
              >
                {registerMutation.isPending ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
