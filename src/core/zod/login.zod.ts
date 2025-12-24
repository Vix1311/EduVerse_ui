import { numberConstants } from '@/configs/consts'
import { z } from 'zod'

export const LoginSchema = z.object({
  user_email: z.string().min(numberConstants.TWO, {
    message: 'Email is valid.'
  }),
  user_password: z.string().min(numberConstants.SIX, {
    message: 'Password must be at least 6 characters.'
  })
})
