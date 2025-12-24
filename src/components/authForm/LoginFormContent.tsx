import { IconEye, IconNonEye } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ROLE_ADMIN, ROLE_EMPLOYEE } from '@/configs/consts';
import { REMEMBER_ME } from '@/core/configs/const';
import { path } from '@/core/constants/path';
import { mutationKeys } from '@/core/helpers/key-tanstack';
import { authApi } from '@/core/services/auth.service';
import { setAccessTokenToLS, setRefreshTokenToLS, setUserToLS } from '@/core/shared/storage';
import { LoginSchema } from '@/core/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { initSocket } from '@/core/services/socket-client';

interface Props {
  onSwitchToSignUp: () => void;
}

export default function LoginFormContent({ onSwitchToSignUp }: Props) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem(REMEMBER_ME) === 'true');

  // Create the form using React Hook Form, validate with Zod schema (LoginSchema)
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      user_email: '',
      user_password: '',
    },
    shouldFocusError: false,
  });

  // Send account login data to server via API authApi.login
  // Use react-query to manage request status
  const mutationLogin = useMutation({
    mutationKey: mutationKeys.login,
    mutationFn: (data: z.infer<typeof LoginSchema>) =>
      authApi.login({
        email: data.user_email,
        password: data.user_password,
      }),
  });

  // Handle form submission when user clicks "Login"
  function onSubmit() {
    setIsLoading(true);
    const loginData = form.getValues();

    mutationLogin.mutate(loginData, {
      onSuccess: async (response: any) => {
        try {
          const res = response?.data || response;

          const { accessToken: access_token, refreshToken: refresh_token } = res || {};

          if (!access_token || !refresh_token) {
            console.error('Raw login response:', response);
            throw new Error('Missing tokens');
          }

          setAccessTokenToLS(access_token);
          setRefreshTokenToLS(refresh_token);
          localStorage.setItem('isLoggedIn', 'true');

          if (rememberMe) localStorage.setItem('email', loginData.user_email);

          const payload = safeDecodeJwt(access_token) || {};
          const role = payload.role || payload.roles?.[0] || payload['https://role'];
          initSocket(access_token);
          toast.success('Signed in successfully.');
          if (role && (isEqual(role, ROLE_ADMIN) || isEqual(role, ROLE_EMPLOYEE))) {
            navigate(path.admin.dashboard);
          } else {
            navigate(path.home);
          }
        } catch (err) {
          console.error('Login parsing error:', err);
          toast.error('Login failed: Invalid response data');
        }
      },

      onError: (error: any) => {
        console.error('Login error:', error);
        toast.error(error?.message || 'Login failed!');
      },
      onSettled: () => setIsLoading(false),
    });
  }

  function safeDecodeJwt(token?: string) {
    try {
      if (!token) return null;
      const [, payload] = token.split('.');
      if (!payload) return null;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // Auto-fill saved email if "Remember me" is checked
  useEffect(() => {
    if (rememberMe) {
      const email = localStorage.getItem('email');
      if (email) {
        form.setValue('user_email', email);
      }
    }
  }, [form, rememberMe]);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const res =
        provider === 'google' ? await authApi.loginWithGoogle() : await authApi.loginWithFacebook();

      const url = (res as any)?.data?.url || (res as any)?.url;
      if (!url) throw new Error('Missing redirect URL');

      window.location.href = url;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Social login failed';
      toast.error(msg);
    }
  };

  return (
    <Form {...form}>
      <input
        title="Prevent autofill"
        type="text"
        name="prevent-autofill"
        autoComplete="username"
        className="hidden"
      />
      <input
        title="Prevent autofill password"
        type="password"
        name="prevent-autofill-password"
        autoComplete="new-password"
        className="hidden"
      />

      <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <h2 className="text-3xl md:text-[40px]  md-915-1000:text-6xl 6xl:text-9xl font-bold text-gray-800 mb-3  md-915-1000:mb-6 6xl:mb-14 text-start">
          Sign in
        </h2>
        <h3 className="text-[15px] sm:text-base md:text-lg  md-915-1000:text-3xl 6xl:text-5xl text-gray-400 pb-4  md-915-1000:pb-8 6xl:pb-14 sm:pb-5">
          Please sign in to continue to your account.
        </h3>

        <div className="space-y-5 6xl:space-y-20">
          {/* Email */}
          <FormField
            control={form.control}
            name="user_email"
            render={({ field }) => {
              const showErr =
                (form.formState.touchedFields.user_email || form.formState.submitCount > 0) &&
                !!form.formState.errors.user_email;
              const hasVal = !!form.watch('user_email');
              const shouldFloat = hasVal || showErr;

              return (
                <FormItem>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        {...field}
                        id="user_email"
                        type="text"
                        placeholder=" "
                        className="peer focus:border-purple-600 text-sm sm:text-base py-2.5 sm:py-3  md-915-1000:h-24 6xl:h-[150px]  md-915-1000:text-4xl 6xl:text-5xl"
                        isError={showErr}
                        errorMessage={
                          showErr
                            ? form.formState.errors.user_email?.message?.toString()
                            : undefined
                        }
                        autoComplete="no-autofill-email"
                      />
                      <label
                        htmlFor="user_email"
                        className={[
                          'pointer-events-none absolute left-3 bg-white px-1 transition',
                          ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                          shouldFloat
                            ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                            : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                          'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                          showErr
                            ? 'text-red-500'
                            : 'text-slate-500 group-focus-within:text-purple-600',
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
            name="user_password"
            render={({ field }) => {
              const showErr =
                (form.formState.touchedFields.user_password || form.formState.submitCount > 0) &&
                !!form.formState.errors.user_password;
              const hasVal = !!form.watch('user_password');
              const shouldFloat = hasVal || showErr;

              return (
                <FormItem>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        {...field}
                        id="user_password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        placeholder=" "
                        className="peer focus:border-purple-600 text-sm sm:text-base py-2.5 sm:py-3  md-915-1000:h-24 6xl:h-[150px]  sm:h-[44px]  md-915-1000:text-4xl 6xl:text-5xl"
                        icon={isPasswordVisible ? <IconEye /> : <IconNonEye />}
                        iconOnClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        isError={showErr}
                        errorMessage={
                          showErr
                            ? form.formState.errors.user_password?.message?.toString()
                            : undefined
                        }
                        autoComplete="current-password"
                      />
                      <label
                        htmlFor="user_password"
                        className={[
                          'pointer-events-none absolute left-3 bg-white px-1 transition',
                          ' text-sm sm:text-base md:text-base lg:text-lg md-915-1000:text-4xl xl:text-base 6xl:text-5xl 4xl:text-5xl',

                          shouldFloat
                            ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                            : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                          'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                          showErr
                            ? 'text-red-500'
                            : 'text-slate-500 group-focus-within:text-purple-600',
                        ].join(' ')}
                      >
                        Password
                      </label>
                    </div>
                  </FormControl>
                </FormItem>
              );
            }}
          />
        </div>

        <div className="flex items-center justify-end py-5  md-915-1000:py-10 6xl:py-16">
          <Link
            to="/forgot-password"
            className="text-[15px] sm:text-base 6xl:text-5xl  md-915-1000:text-3xl font-normal text-gray-500 cursor-pointer focus:outline-none focus-visible:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button
          loading={isLoading}
          className="w-full text-white bg-purple-500 hover:bg-purple-600 h-12  md-915-1000:h-24 6xl:h-[150px] sm:h-[52px] text-base sm:text-[18px]  md-915-1000:text-3xl 6xl:text-6xl font-semibold transition-colors duration-300 focus:outline-none"
          type="submit"
        >
          Sign in
        </Button>

        <div className="text-center mt-4  md-915-1000:mt-10 6xl:mt-16">
          <div className="text-sm sm:text-base  md-915-1000:text-3xl 6xl:text-5xl">
            <span className="text-gray-600">Don't have an account? </span>
            <button
              type="button"
              className="text-purple-500 font-semibold underline"
              onClick={onSwitchToSignUp}
            >
              Sign Up
            </button>
          </div>

          <div className="mt-4 6xl:mt-16">
            <div className="flex items-center my-4 md-915-1000:mt-10 6xl:my-16">
              <div className="flex-grow border-t border-gray-300 md-915-1000:border-2 6xl:border-2" />
              <span className="mx-4 text-gray-600 text-sm 6xl:text-5xl md-915-1000:text-3xl">
                Or sign in with
              </span>
              <div className="flex-grow border-t border-gray-300 md-915-1000:border-2 6xl:border-2" />
            </div>
            <div className="flex justify-center space-x-6 6xl:space-x-16 md-915-1000:space-x-10">
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                className="text-blue-600 hover:text-blue-800"
                aria-label="Sign in with Facebook"
              >
                <FontAwesomeIcon
                  icon={faFacebook}
                  className="text-2xl sm:text-[28px] 6xl:text-7xl md-915-1000:text-5xl"
                />
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="text-red-500 hover:text-red-700"
                aria-label="Sign in with Google"
              >
                <FontAwesomeIcon
                  icon={faGoogle}
                  className="text-2xl sm:text-[28px] 6xl:text-7xl md-915-1000:text-5xl"
                />
              </button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
