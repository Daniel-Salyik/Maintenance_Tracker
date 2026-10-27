import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong')
        return
      }
      setMessage(body.message ?? 'If an account exists, a reset link has been sent.')
    } catch {
      setError('Could not reach the server')
    }
  }

  return (
    <main className="auth-page">
      <h1>Forgot password</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {message && <p role="status">{message}</p>}
        {error && <p role="alert" className="auth-error">{error}</p>}
        <button type="submit">Send</button>
      </form>
      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </main>
  )
}

export default ForgotPasswordPage
