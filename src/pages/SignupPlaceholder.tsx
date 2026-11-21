import { Link } from 'react-router-dom'
import { AuthCard, AuthLayout } from '../components/auth/AuthLayout'

/** Temporary: replaced by the real Sign-up page in step 3. */
export default function SignupPlaceholder() {
  return (
    <AuthLayout swirl="signup">
      <AuthCard className="text-center">
        <h1 className="text-[40px] font-bold text-bokara dark:text-whisper">Get started</h1>
        <p className="mt-4 text-[15px] text-bokara/70 dark:text-whisper/70">Sign-up arrives in the next step.</p>
        <Link to="/login" className="mt-6 inline-block text-[15px] text-lime underline">
          Back to log-in
        </Link>
      </AuthCard>
    </AuthLayout>
  )
}
