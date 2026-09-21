import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const user = await login(formData.email, formData.password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/equipment')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <p className="brand-text">LabReserve</p>
        <h1>Engineering Lab Equipment Request System</h1>
        <p>Request shared lab equipment using a simple first-come, first-served workflow.</p>
      </section>
      <section className="auth-card" aria-labelledby="login-title">
        <h2 id="login-title">Welcome back</h2>
        <p className="muted-text">Sign in to continue</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-group"><span>Email</span><input name="email" type="email" placeholder="student@university.lk" value={formData.email} onChange={handleChange} required /></label>
          <label className="form-group"><span>Password</span><input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required /></label>
          {errorMessage && <p className="form-error">{errorMessage}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="auth-links">
          <Link to="/register">New student? Create an account</Link>
          <Link to="/admin">Admin sign in</Link>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
