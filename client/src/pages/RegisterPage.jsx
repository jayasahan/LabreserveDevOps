import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
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
      await register(formData.name, formData.email, formData.password)
      navigate('/equipment')
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
        <p>Create a student account to request shared lab equipment using the same first-come, first-served workflow.</p>
      </section>
      <section className="auth-card" aria-labelledby="register-title">
        <h2 id="register-title">Create account</h2>
        <p className="muted-text">Register as a student to continue</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-group"><span>Name</span><input name="name" type="text" placeholder="Your full name" value={formData.name} onChange={handleChange} required /></label>
          <label className="form-group"><span>Email</span><input name="email" type="email" placeholder="student@university.lk" value={formData.email} onChange={handleChange} required /></label>
          <label className="form-group"><span>Password</span><input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} minLength="6" required /></label>
          {errorMessage && <p className="form-error">{errorMessage}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button>
        </form>
        <div className="auth-links"><Link to="/">Already have an account? Sign in</Link></div>
      </section>
    </main>
  )
}

export default RegisterPage
