import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppDispatch, RootState } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { resendEmailOtp, verifyEmailOtp } from '@/redux/slices/otpConfirm.slices';
import { logo } from '@/assets/images';
import authImage from '@/assets/images/Auth.png';

const OtpConfirm = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [counter, setCounter] = useState(30);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.otpConfirm);

  // Countdown
  useEffect(() => {
    if (counter === 0) return;
    const timer = setInterval(() => setCounter(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  // Handles OTP input changes
  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];

    if (value.length === 1) {
      next[index] = value;
      setOtp(next);
      if (index < otp.length - 1) document.getElementById(`otp-${index + 1}`)?.focus();
    } else if (value.length > 1) {
      for (let i = 0; i < value.length && i + index < otp.length; i++) {
        next[index + i] = value[i];
      }
      setOtp(next);
      const nextIndex = Math.min(index + value.length, otp.length - 1);
      document.getElementById(`otp-${nextIndex}`)?.focus();
    }
  };

  // Handles backspace key presses in OTP inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...otp];
      if (otp[index]) {
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setOtp(next);
        document.getElementById(`otp-${index - 1}`)?.focus();
      }
    }
  };

  // Resends OTP to the given email
  const handleResend = () => {
    if (counter > 0) return;
    setCounter(30);
    setOtp(['', '', '', '', '', '']);
    dispatch(resendEmailOtp(email))
      .unwrap()
      .then(() => toast.success('OTP resent!'))
      .catch(err => toast.error(err));
  };

  // Submits the entered OTP for verification
  const handleSubmit = () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Please enter full 6 digits.');
    dispatch(verifyEmailOtp({ email, otp: code }))
      .unwrap()
      .then(() => {
        toast.success('Verification successful! Please login.');
        navigate('/auth');
      })
      .catch(err => toast.error(err));
  };

  // Formats seconds into "mm:ss" format
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <div className="relative z-10 bg-white shadow-2xl rounded-2xl overflow-hidden w-full flex flex-col xl:flex-row">
        {/* LEFT: Form Section */}
        <div className="xl:w-[35%] md:px-48  w-full px-10 xl:px-24 py-8 flex flex-col justify-center min-h-screen rounded-l-2xl bg-white">
          <div className="absolute top-4 left-4 z-20">
            <Link to="/">
              <div className="flex gap-1 items-center">
                <img src={logo} alt="logo" className="transition-all duration-300 h-12" />
              </div>
            </Link>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold text-gray-900">Email Verification</h2>
              <div className="pt-4">
                <p className="text-sm font-medium text-[#B2B3BD]">
                  Please enter the OTP you received at
                </p>
                <p className="text-sm font-medium text-gray-900">{email}</p>
              </div>
            </div>

            <div className="flex justify-center gap-5 pt-2">
              {otp.map((digit, index) => (
                <input
                  title="text"
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  className="md:h-[72px] md:w-[51px] h-[48px] w-[34px] text-center text-xl border border-gray-300 rounded focus:outline-none"
                  value={digit}
                  onChange={e => handleChange(e.target.value, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onPaste={e => e.preventDefault()}
                  onDrop={e => e.preventDefault()}
                />
              ))}
            </div>

            <div className="flex justify-between items-center text-sm">
              <button
                onClick={handleResend}
                disabled={counter > 0 || loading}
                className={`font-semibold ${
                  counter === 0 ? 'text-[#8C6DFD]' : 'text-gray-400 cursor-not-allowed'
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

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-purple-500 text-white py-3 rounded hover:bg-purple-600 transition duration-300 text-[16px] font-semibold"
            >
              Confirm
            </button>

            <div className="text-start">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-[#8C6DFD] font-semibold"
              >
                <img src="/src/assets/icons/back.svg" alt="back" />
                <span>Back to login</span>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT: Image Section */}
        <div className="relative lg:w-[65%] w-full p-3 bg-white rounded-r-full hidden xl:block">
          <div
            className="w-full h-full bg-cover bg-center rounded-xl"
            style={{ backgroundImage: `url('${authImage}')` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default OtpConfirm;
