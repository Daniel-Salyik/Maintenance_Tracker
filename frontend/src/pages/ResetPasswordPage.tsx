import { useState, useEffect, type FormEvent } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(token ? '' : 'This link is expired.')
  const [isValidating, setIsValidating] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setError('This link is expired.')
      setIsValidating(false)
      return
    }

    let cancelled = false
    fetch(`${API_URL}/auth/reset-password/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setError('This link is expired.')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the server')
      })
      .finally(() => {
        if (!cancelled) setIsValidating(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!token) {
      setError('This link is expired.')
      return
    }
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong')
        return
      }
      setMessage(body.message ?? 'Password reset successful. Please log in.')
      navigate('/login', { state: { message: body.message ?? 'Password reset successful. Please log in.' } })
    } catch {
      setError('Could not reach the server')
    }
  }

  if (!token || error === 'This link is expired.') {
    return (
      <main className="auth-page">
        <h1>Reset password</h1>
        <p role="alert" className="auth-error">This link is expired.</p>
        <p>
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
        <p>
          <Link to="/login">Back to login</Link>
        </p>
      </main>
    )
  }

  if (isValidating) {
    return (
      <main className="auth-page">
        <h1>Reset password</h1>
        <p role="status">Checking reset link…</p>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <h1>Reset password</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="password">New password</label>
        <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {message && <p role="status">{message}</p>}
        {error && <p role="alert" className="auth-error">{error}</p>}
        <button type="submit">Reset password</button>
      </form>
      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </main>
  )
}

export default ResetPasswordPage