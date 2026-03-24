"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { API_URL } from '@/config'

export default function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAction = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register'
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (res.ok) {
        if (mode === 'login') {
          localStorage.setItem('token', data.token)
          setPassword('')
          router.push('/dashboard')
        } else {
          setSuccess(data.msg || 'Registro exitoso. Espere aprobación.')
          setMode('login')
          setUsername('')
          setPassword('')
        }
      } else {
        setError(data.error || 'Ocurrió un error')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md animate-fade-in relative z-10 px-4">
      <div className="glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-2xl border border-white/20 dark:border-white/5">
        <div className="relative z-10 text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-md border border-primary/20 transition-transform hover:scale-110">
            <img src="/favicon.ico" alt="Go Asistencias Logo" className="w-10 h-10 transition-all" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-foreground">GO ASISTENCIAS <span className="text-primary italic">APP</span></h1>
          <p className="text-foreground/50 mb-10 font-bold tracking-[0.2em] uppercase text-[9px]">Uso del area de sistemas</p>
          
          {error && (
            <div className="alert alert-error mb-6 bg-red-500/10 border-red-500/20 text-red-500 py-3 rounded-xl animate-shake flex items-center gap-2">
              <span className="text-xs font-bold leading-none">{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-6 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 py-3 rounded-xl flex items-center gap-2">
              <span className="text-xs font-bold leading-none">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors text-foreground/20">
                <User size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Usuario" 
                className="input w-full pl-12 bg-base-300/20 dark:bg-base-200/50 border-foreground/[0.05] hover:border-primary/30 focus:border-primary/50 focus:bg-base-100 dark:focus:bg-base-200 transition-all rounded-2xl h-14 font-semibold text-foreground placeholder:text-foreground/30 shadow-sm" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors text-foreground/20">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Contraseña" 
                className="input w-full pl-12 pr-12 bg-base-300/20 dark:bg-base-200/50 border-foreground/[0.05] hover:border-primary/30 focus:border-primary/50 focus:bg-base-100 dark:focus:bg-base-200 transition-all rounded-2xl h-14 font-semibold text-foreground placeholder:text-foreground/30 shadow-sm" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                aria-label="Contraseña"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-4 flex items-center text-foreground/60 hover:text-foreground/90 transition-colors"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <button
              className="btn btn-primary w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all group border-none flex items-center justify-center"
              onClick={handleAction}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 mr-3 rounded-full border-2 border-white/30 border-t-current animate-spin" aria-hidden="true"></span>
                  <span className="text-sm font-black">{mode === 'login' ? 'Accediendo...' : 'Registrando...'}</span>
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Acceder' : 'Registrar'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-3" />
                </>
              )}
            </button>

            <div className="pt-6 border-t border-foreground/[0.05]">
              <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                className="text-[10px] font-black text-primary/70 hover:text-primary uppercase tracking-[0.15em] transition-colors"
              >
                {mode === 'login' ? '¿Crear nueva cuenta administrativa?' : '¿Ya tienes una cuenta? Iniciar Sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center mt-8 text-foreground/30 text-[9px] font-black uppercase tracking-[0.3em]">&copy; 2026 GO ASISTENCIAS &bull; AREA DE SISTEMAS GO ASISTENCIAS</p>
    </div>
  )
}
