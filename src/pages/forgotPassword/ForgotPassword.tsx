import { AppDispatch, RootState } from '@/core/store/store';
import { resetPassword, sendForgotPasswordEmail } from '@/redux/slices/forgotPassword.slice';
import { trim } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { IconEye, IconNonEye } from '@/assets/icons';
import authImage from '@/assets/images/Auth.png';
import { logo } from '@/assets/images';

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

type FormValues = {
  password: string;
  confirm_password: string;
};

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpArr, setOtpArr] = useState(['', '', '', '', '', '']);
  const [counter, setCounter] = useState(0);
  const [otp, setOtp] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.forgotPassword);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const form = useForm<FormValues>({ mode: 'onSubmit' });

  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const isOtpValid = otpArr.every(val => /^\d$/.test(val)) && otpArr.join('').length === 6;
  const [otpSubmitted, setOtpSubmitted] = useState(false);

  // OTP
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpArr];
    next[index] = value;
    setOtpArr(next);
    setOtpSubmitted(false);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpArr[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Countdown
  useEffect(() => {
    if (currentStep !== 2 || counter <= 0) return;
    const t = setInterval(() => setCounter(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [currentStep, counter]);

  useEffect(() => {
    if (currentStep !== 2) setCounter(0);
  }, [currentStep]);

  const handleResend = async () => {
    setCounter(30);
    setOtpArr(['', '', '', '', '', '']);
    setOtpSubmitted(false);
    dispatch(sendForgotPasswordEmail(email))
      .unwrap()
      .then(() => toast.success('New OTP code has been resent!'))
      .catch(err => toast.error(err));
  };

  // password strength
  type PasswordStrength = 'weak' | 'medium' | 'strong';
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
  const [passwordValue, setPasswordValue] = useState('');

  function getPasswordStrength(password: string): PasswordStrength {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div>
      <div className="relative z-10 bg-white shadow-2xl rounded-2xl overflow-hidden w-full flex flex-col xl:flex-row">
        {/* LEFT */}
        <div className="xl:w-[35%] w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-24 py-8 flex flex-col justify-center min-h-screen bg-white">
          <div className="absolute top-4 left-4 z-20">
            <Link to="/">
              <div className="flex gap-1 items-center">
                <img
                  src={logo}
                  alt="logo"
                  className="transition-all duration-300 h-10 sm:h-12 6xl:h-32"
                />
              </div>
            </Link>
          </div>

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-3xl md:text-[39px] md-915-1000:text-6xl 6xl:text-9xl font-bold text-gray-800 mb-7 md-915-1000:mb-6 6xl:mb-16">
                Forgot Password
              </h2>
              <p className="text-[15px] sm:text-base md:text-lg md-915-1000:text-3xl 6xl:text-5xl text-gray-400 pb-4 sm:pb-7 md-915-1000:pb-8 6xl:pb-16">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form
                onSubmit={async e => {
                  e.preventDefault();

                  const trimmed = email.trim();
                  if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
                    toast.error('Invalid email');
                    return;
                  }

                  try {
                    await dispatch(sendForgotPasswordEmail(trim(trimmed))).unwrap();
                    toast.success('OTP has been sent to your email', {
                      onClose: () => {
                        setCurrentStep(2);
                        setCounter(30);
                      },
                    });
                  } catch (err: any) {
                    const message =
                      typeof err === 'string'
                        ? err
                        : err?.message ||
                          'Unable to send OTP. Please check your network connection and try again.';
                    toast.error(message);
                  }
                }}
                autoComplete="off"
                className="space-y-4 sm:space-y-7 md-915-1000:space-y-10 6xl:space-y-20"
              >
                {/* Email */}
                <div className="relative group">
                  <Input
                    id="forgot_email"
                    type="email"
                    inputMode="email"
                    placeholder=" "
                    className="peer focus:border-purple-600 text-sm sm:text-base md-915-1000:text-4xl 6xl:text-5xl h-12 sm:h-[59px] md-915-1000:h-24 6xl:h-[150px]"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    isError={false}
                    autoComplete="off"
                  />
                  <label
                    htmlFor="forgot_email"
                    className={[
                      'pointer-events-none absolute left-3 bg-white px-1 transition',
                      'text-xs sm:text-sm md:text-base lg:text-lg md-915-1000:text-3xl xl:text-xl 4xl:text-5xl',
                      email
                        ? '-top-2 scale-90'
                        : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                      'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',
                      'text-slate-500 group-focus-within:text-purple-600',
                    ].join(' ')}
                  >
                    Email
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full text-white bg-purple-500 hover:bg-purple-600 h-12 sm:h-[52px] md-915-1000:h-24 6xl:h-[150px] text-base sm:text-[18px] md-915-1000:text-3xl 6xl:text-6xl font-semibold transition-colors duration-300 focus:outline-none"
                  disabled={loading}
                >
                  {loading ? 'Loading' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-3xl md:text-[40px] md-915-1000:text-6xl 6xl:text-9xl font-bold text-gray-800 mb-3 md-915-1000:mb-6 6xl:mb-14">
                Verification
              </h2>
              <p className="text-[15px] sm:text-base md:text-lg md-915-1000:text-3xl 6xl:text-5xl text-gray-400 pb-4 sm:pb-5 md-915-1000:pb-8 6xl:pb-14">
                Please enter your 6 digits code that you received on your email.
              </p>

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setOtpSubmitted(true);

                  if (!isOtpValid) {
                    toast.error('Please enter 6 valid OTP digits');
                    return;
                  }

                  try {
                    const code = otpArr.join('');
                    setOtp(code);
                    toast.success('OTP verified', {
                      onClose: () => {
                        setCurrentStep(3);
                      },
                    });
                  } catch (err: any) {
                    const message =
                      typeof err === 'string'
                        ? err
                        : err?.message ||
                          'OTP authentication failed. Please check your network and try again.';
                    toast.error(message);
                  }
                }}
                autoComplete="off"
              >
                <div className="flex justify-center mb-3 sm:mb-4 gap-3 sm:gap-4 md-915-1000:gap-6 6xl:gap-14">
                  {otpArr.map((val, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      onPaste={e => e.preventDefault()}
                      onDrop={e => e.preventDefault()}
                      className={[
                        'text-center border rounded focus:outline-none text-purple-700 font-medium',
                        'h-11 w-9 sm:h-[59px] sm:w-12 md-915-1000:h-24 md-915-1000:w-24 6xl:h-[200px] 6xl:w-[150px] ',
                        'text-lg sm:text-2xl md-915-1000:text-5xl 6xl:text-7xl',
                        otpSubmitted && (!/^\d$/.test(val) || otpArr.join('').length < 6)
                          ? 'border-red-500'
                          : 'border-gray-300 focus:border-purple-600',
                      ].join(' ')}
                      autoFocus={idx === 0}
                      inputMode="numeric"
                      title="OTP"
                    />
                  ))}
                </div>

                {otpSubmitted && !isOtpValid && (
                  <p className="text-red-500 text-center text-xs sm:text-sm md-915-1000:text-2xl 6xl:text-5xl 6xl:py-10">
                    Please enter 6 valid OTP digits.
                  </p>
                )}

                <div className="flex justify-between items-center text-xs sm:text-sm md-915-1000:text-2xl 6xl:text-5xl py-4 sm:py-5 6xl:py-14">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={counter > 0}
                    className={`font-semibold ${
                      counter === 0
                        ? 'text-[#8C6DFD] hover:text-purple-600'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Resend OTP
                  </button>
                  {counter > 0 ? (
                    <span className="font-medium text-red-500">{formatTime(counter)}</span>
                  ) : (
                    <span />
                  )}
                </div>

                <div className="pt-1 sm:pt-2">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full text-white bg-purple-500 hover:bg-purple-600 h-12 sm:h-[52px] md-915-1000:h-24 6xl:h-[150px] text-base sm:text-[18px] md-915-1000:text-3xl 6xl:text-6xl rounded font-semibold transition"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-3xl md:text-[34px] md-915-1000:text-6xl 6xl:text-9xl font-bold text-gray-800 mb-3 md-915-1000:mb-6 6xl:mb-20">
                Create new password
              </h2>
              <p className="text-[15px] sm:text-base md:text-lg md-915-1000:text-3xl 6xl:text-5xl text-gray-400 pb-4 sm:pb-5 md-915-1000:pb-8 6xl:pb-20">
                Set the new password for your account so you can sign in.
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(data => {
                    dispatch(
                      resetPassword({
                        code: otpArr.join(''),
                        email,
                        newPassword: data.password,
                        confirmNewPassword: data.confirm_password,
                      }),
                    )
                      .unwrap()
                      .then(() => {
                        toast.success('Password reset successful!');
                        navigate('/auth');
                      })
                      .catch(err => toast.error(err));
                  })}
                  className="space-y-4 sm:space-y-5 md-915-1000:space-y-10 6xl:space-y-20"
                  autoComplete="off"
                >
                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    rules={{
                      required: 'Password is invalid',
                      pattern: {
                        value: passwordRegex,
                        message: 'Password must be at least 6 characters long',
                      },
                    }}
                    render={({ field }) => {
                      const showErr =
                        (form.formState.touchedFields.password || form.formState.submitCount > 0) &&
                        !!form.formState.errors.password;
                      const hasVal = !!form.watch('password');
                      const shouldFloat = hasVal || showErr;

                      return (
                        <FormItem>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                {...field}
                                id="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                placeholder=" "
                                className="peer focus:border-purple-600 text-sm sm:text-base md-915-1000:text-4xl 6xl:text-5xl h-12 sm:h-[59px] md-915-1000:h-24 6xl:h-[150px]"
                                isError={showErr}
                                errorMessage={
                                  showErr
                                    ? form.formState.errors.password?.message?.toString()
                                    : undefined
                                }
                                icon={isPasswordVisible ? <IconEye /> : <IconNonEye />}
                                iconOnClick={() => setIsPasswordVisible(v => !v)}
                                onChange={e => {
                                  const value = e.target.value;
                                  field.onChange(value);
                                  setPasswordValue(value);
                                  setPasswordStrength(getPasswordStrength(value));
                                }}
                                aria-invalid={showErr ? 'true' : 'false'}
                              />
                              {passwordValue && passwordStrength !== 'strong' && (
                                <div
                                  className="transition-opacity duration-150 mt-2 sm:mt-3"
                                  aria-live="polite"
                                >
                                  <div className="flex gap-1 sm:gap-1.5 md-915-1000:gap-2 6xl:gap-3">
                                    {[0, 1, 2, 3, 4].map(i => (
                                      <div
                                        key={i}
                                        className={`rounded-sm h-1 sm:h-[6px] md-915-1000:h-3 6xl:h-4 flex-1 ${
                                          passwordStrength === 'weak' && i === 0
                                            ? 'bg-red-500'
                                            : passwordStrength === 'medium' && i <= 2
                                              ? 'bg-yellow-500'
                                              : 'bg-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <label
                                htmlFor="password"
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
                                New Password
                              </label>
                            </div>
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />

                  {/* Confirm password */}
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    rules={{
                      required: 'Please confirm your password',
                      validate: (value: string) =>
                        value === form.getValues('password') || 'Passwords do not match',
                    }}
                    render={({ field }) => {
                      const showErr =
                        (form.formState.touchedFields.confirm_password ||
                          form.formState.submitCount > 0) &&
                        !!form.formState.errors.confirm_password;
                      const hasVal = !!form.watch('confirm_password');
                      const shouldFloat = hasVal || showErr;

                      return (
                        <FormItem>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                {...field}
                                id="confirm_password"
                                autoComplete="new-password"
                                type={isConfirmPasswordVisible ? 'text' : 'password'}
                                placeholder=" "
                                className="peer focus:border-purple-600 text-sm sm:text-base md-915-1000:text-4xl 6xl:text-5xl h-12 sm:h-[59px] md-915-1000:h-24 6xl:h-[150px]"
                                icon={isConfirmPasswordVisible ? <IconEye /> : <IconNonEye />}
                                iconOnClick={() => setIsConfirmPasswordVisible(v => !v)}
                                isError={showErr}
                                errorMessage={
                                  showErr
                                    ? form.formState.errors.confirm_password?.message?.toString()
                                    : undefined
                                }
                                aria-invalid={showErr ? 'true' : 'false'}
                              />
                              <label
                                htmlFor="confirm_password"
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
                                Confirm Password
                              </label>
                            </div>
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />

                  <button
                    type="submit"
                    className="w-full text-white bg-purple-500 hover:bg-purple-600 h-12 sm:h-[52px] md-915-1000:h-24 6xl:h-[150px] text-base sm:text-[18px] md-915-1000:text-3xl 6xl:text-6xl rounded transition duration-300 focus:outline-none font-semibold"
                  >
                    Reset Password
                  </button>
                </form>
              </Form>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="relative xl:w-[65%] w-full p-3 bg-white rounded-r-full hidden xl:block">
          <div
            className="w-full h-full bg-cover bg-center rounded-xl"
            style={{ backgroundImage: `url('${authImage}')` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
