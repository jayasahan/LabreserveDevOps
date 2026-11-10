import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage({ audience = 'student' }) {
  const isAdminLogin = audience === 'admin'
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
        <div className="auth-hero__content">
          <p className="brand-text">LabReserve</p>
          <h1>Engineering Lab Equipment Request System</h1>
          <p>Request shared lab equipment using a simple first-come, first-served workflow.</p>
        </div>
        <svg className="auth-hero__art" viewBox="0 0 400 220" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
            <g>
              <path d="m55 36 25-25 23 23-25 25z" />
              <path d="m77 58 42 42m-9-9a38 38 0 0 1-38 44H54" />
              <path d="M54 135v17m-23 0h88m-66-2a34 34 0 0 1 34-34" />
              <circle cx="109" cy="99" r="7" />
            </g>
            <g>
              <path d="M199 25v42l-32 65a14 14 0 0 0 13 20h59a14 14 0 0 0 13-20l-32-65V25" />
              <path d="M188 25h43m-52 91h68m-55-20h42" />
              <circle cx="207" cy="109" r="4" />
              <circle cx="222" cy="104" r="3" />
            </g>
            <g>
              <rect x="285" y="79" width="92" height="70" rx="8" />
              <path d="M298 116h13l7-14 10 29 8-15h14m14-25h1m0 12h1m0 12h1m-47 34v12m24-12v12m-36 0h48" />
            </g>
          </g>
        </svg>
      </section>
      <section className="auth-card" aria-labelledby="login-title">
        <h2 id="login-title">{isAdminLogin ? 'Administrator sign in' : 'Welcome back'}</h2>
        <p className="muted-text">
          {isAdminLogin
            ? 'Sign in with your administrator account.'
            : 'Sign in to continue'}
        </p>
        {isAdminLogin && (
          <p className="muted-text">
            Admin access is assigned to your account; this page does not grant admin permissions.
          </p>
        )}
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-group"><span>Email</span><input name="email" type="email" placeholder="student@university.lk" value={formData.email} onChange={handleChange} required /></label>
          <label className="form-group"><span>Password</span><input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required /></label>
          {errorMessage && <p className="form-error">{errorMessage}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="auth-links">
          {isAdminLogin ? (
            <Link to="/">Student login</Link>
          ) : (
            <>
              <Link to="/register">New student? Create an account</Link>
              <Link to="/admin/login">Administrator? Sign in here</Link>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default LoginPage
