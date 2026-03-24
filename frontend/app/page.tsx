
import LoginBackground from '@/components/login/LoginBackground'
import LoginForm from '@/components/login/LoginForm'
import { Aurora } from '@/components/aceternity/Aurora'

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-transparent">
      <Aurora className="opacity-100" />
      <LoginForm />
    </main>
  )
}