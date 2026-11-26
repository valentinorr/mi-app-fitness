import { useState, FormEvent, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function LoginRegister() {
  const { login, register, loading } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const errorDialogRef = useRef<HTMLDialogElement>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError(null)

    const form = e.currentTarget
    // Let browser native validation run first
    if (!form.checkValidity()) {
      form.reportValidity()
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
      setServerError(Array.isArray(msg) ? msg[0]?.msg || msg : msg)
      errorDialogRef.current?.showModal()
    }
  }

  const handleSwitchMode = () => {
    setIsRegister((prev) => !prev)
    setServerError(null)
    // Reset form validation state
    formRef.current?.reset()
  }

  const closeErrorDialog = () => {
    errorDialogRef.current?.close()
    setServerError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Data Based Training</h1>
          <p className="mt-2 text-gray-600">
            {isRegister ? 'Crea tu cuenta' : 'Inicia sesión para continuar'}
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-6"
          data-testid="login-form"
          noValidate
        >
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
                minLength={2}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:bg-blue-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-colors transition-transform"
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
                onClick={handleSwitchMode}
                className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:text-blue-800 transition-colors"
              >
                Inicia sesión
              </button>
            </span>
          ) : (
            <span>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={handleSwitchMode}
                className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:text-blue-800 transition-colors"
              >
                Regístrate
              </button>
            </span>
          )}
        </div>

        {/* Native <dialog> for server errors */}
        <dialog
          ref={errorDialogRef}
          className="border-none rounded-xl shadow-xl p-0 max-w-sm"
          style={{ background: 'white' }}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">Error</h3>
                <p className="mt-1 text-sm text-gray-600">{serverError}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeErrorDialog}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Entendido
              </button>
            </div>
          </div>
          <form method="dialog" className="hidden">
            <button type="submit" value="cancel">Cancel</button>
          </form>
        </dialog>

        <style>{`
          /* Native validation styling with :user-invalid */
          input:user-invalid {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }

          input:user-invalid:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
          }

          /* Dialog backdrop styling */
          dialog::backdrop {
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
          }
        `}</style>
      </div>
    </div>
  )
}