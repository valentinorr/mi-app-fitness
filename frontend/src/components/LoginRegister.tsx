import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function LoginRegister() {
  const { login, register, loading } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Email y contraseña son obligatorios')
      return
    }

    if (isRegister && !fullName.trim()) {
      setError('El nombre es obligatorio para registrar')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      if (isRegister) {
        await register(email, password, fullName)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error de autenticación'
      setError(Array.isArray(msg) ? msg[0]?.msg || msg : msg)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Data Based Training</h1>
          <p className="mt-2 text-gray-600">
            {isRegister ? 'Crea tu cuenta' : 'Inicia sesión para continuar'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
          {isRegister && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete={isRegister ? 'email' : 'username'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          {isRegister ? (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Inicia sesión
              </button>
            </span>
          ) : (
            <span>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Regístrate
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}