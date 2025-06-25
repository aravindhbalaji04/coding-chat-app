import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isLogin) {
      await signIn(email, password)
    } else {
      await signUp(email, password, displayName)
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div>
          <h2 className="auth-title">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="displayName" className="sr-only">
                  Display Name
                </label>
                <div className="input-container">
                  <div className="input-icon">
                    <User size={20} />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="form-input"
                    placeholder="Display Name"
                  />
                </div>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <Mail size={20} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="input-container">
                <div className="input-icon">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                isLogin ? 'Sign in' : 'Sign up'
              )}
            </button>
          </div>

          <div className="text-center" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="btn-link"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthForm