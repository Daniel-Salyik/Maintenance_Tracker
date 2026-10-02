import { Link, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'

// Stub pages: real register / forgot-password / dashboard come with their own scenarios.
function Stub({ title, text }: { title: string; text?: string }) {
  return (
    <main className="auth-page">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
      <p><Link to="/login">Back to login</Link></p>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Stub title="Register" />} />
      <Route path="/forgot-password" element={<Stub title="Forgot password" />} />
      <Route path="/dashboard" element={<Stub title="Dashboard" text="Welcome back!" />} />
    </Routes>
  )
}

export default App
