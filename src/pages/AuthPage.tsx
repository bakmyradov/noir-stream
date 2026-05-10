import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LogoMark from '../components/LogoMark'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const { user, loading, signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) navigate(redirect, { replace: true })
  }, [user, loading, navigate, redirect])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const { error } =
      mode === 'signin'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password, displayName.trim() || undefined)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (mode === 'signup') {
      setInfo('Account created. You can now sign in.')
      setMode('signin')
    }
  }

  async function onGoogle() {
    setError(null)
    const { error } = await signInWithGoogle(`${window.location.origin}${redirect}`)
    if (error) setError(error)
  }

  return (
    <div className="min-h-svh bg-bg flex items-center justify-center px-5 py-10 animate-fade-in">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <Link
          to="/"
          className="flex items-center gap-2.5 mb-10 transition-opacity hover:opacity-80"
          aria-label="Back to home"
        >
          <span className="text-accent flex">
            <LogoMark style="aperture" size={24} />
          </span>
          <span className="font-heading font-light text-[24px] tracking-[0.22em] pr-[0.22em] text-fg">
            NOIR
          </span>
        </Link>

        <div className="flex gap-1.5 mb-8" role="tablist">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m)
                setError(null)
                setInfo(null)
              }}
              className={`px-4 py-1.5 rounded-[2px] border font-sans text-[11px] tracking-[0.18em] uppercase cursor-pointer transition-all duration-200 ${
                mode === m
                  ? 'bg-accent/10 border-accent2 text-accent'
                  : 'border-white/10 text-fg-muted hover:border-white/22 hover:text-fg'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/12 text-fg px-5 py-3 rounded-[2px] font-sans text-xs tracking-[0.08em] uppercase cursor-pointer transition-[background,border-color] duration-200 hover:bg-white/8 hover:border-white/22"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.5 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.5 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6 w-full">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[9px] tracking-[0.25em] uppercase text-fg-dim">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        <form onSubmit={onSubmit} className="w-full flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name (optional)"
              autoComplete="name"
              className="w-full bg-white/4 border border-white/10 text-fg placeholder-fg-dim px-4 py-3 rounded-[2px] font-sans text-sm focus:outline-none focus:border-accent2 transition-colors"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full bg-white/4 border border-white/10 text-fg placeholder-fg-dim px-4 py-3 rounded-[2px] font-sans text-sm focus:outline-none focus:border-accent2 transition-colors"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            className="w-full bg-white/4 border border-white/10 text-fg placeholder-fg-dim px-4 py-3 rounded-[2px] font-sans text-sm focus:outline-none focus:border-accent2 transition-colors"
          />

          {error && (
            <div role="alert" className="text-[12px] text-red-300/90 tracking-[0.04em]">
              {error}
            </div>
          )}
          {info && (
            <div className="text-[12px] text-accent tracking-[0.04em]">{info}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center bg-accent text-bg border-none rounded-[2px] px-9 py-3 font-sans text-xs font-medium tracking-widest uppercase cursor-pointer transition-[filter,transform] duration-200 hover:brightness-110 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {submitting ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
