import { cn } from '@/core/lib/utils';
import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconOnClick?: () => void;
  isError?: boolean;
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconOnClick, isError, errorMessage, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type={type}
          autoComplete="off"
          className={cn(
            'flex md:h-[59px] h-[44px] w-full rounded-md border bg-white px-[25px] py-[15px] md-915-1000:px-5 6xl:px-12 text-lg focus:outline-none focus:ring-0 placeholder:text-base',
            isError
              ? 'border-red-500 text-red-500 placeholder-red-400'
              : 'border-slate-200 text-black placeholder-slate-500',
            className,
          )}
          {...props}
          placeholder={isError ? errorMessage : props.placeholder}
          ref={ref}
        />

        {icon && (
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3 xl:text-2xl md-915-1000:text-5xl 6xl:text-6xl cursor-pointer text-gray-500"
            onClick={iconOnClick}
          >
            {icon}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
