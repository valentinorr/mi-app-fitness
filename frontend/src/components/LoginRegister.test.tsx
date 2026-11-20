import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginRegister } from './LoginRegister'

// Mock AuthContext
const mockAuth = {
  login: vi.fn(),
  register: vi.fn(),
  loading: false,
  logout: vi.fn(),
  user: null,
  isAuthenticated: false,
  checkAuth: vi.fn(),
}

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuth,
}))

describe('LoginRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.login.mockResolvedValue(undefined)
    mockAuth.register.mockResolvedValue(undefined)
    mockAuth.loading = false
  })

  it('renders login form by default', () => {
    render(<LoginRegister />)

    expect(screen.getByText('Data Based Training')).toBeInTheDocument()
    expect(screen.getByText('Inicia sesión para continuar')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()
  })

  it('switches to register mode when clicking "Regístrate"', async () => {
    render(<LoginRegister />)
    fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))

    expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument()
  })

  it('switches back to login mode when clicking "Inicia sesión"', async () => {
    render(<LoginRegister />)
    fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inicia sesión' }))

    expect(screen.getByText('Inicia sesión para continuar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('shows error when email is empty on submit', async () => {
    render(<LoginRegister />)

    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Email y contraseña son obligatorios')).toBeInTheDocument()
    })
    expect(mockAuth.login).not.toHaveBeenCalled()
  })

  it('shows error when password is empty on submit', async () => {
    render(<LoginRegister />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Email y contraseña son obligatorios')).toBeInTheDocument()
    })
    expect(mockAuth.login).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    render(<LoginRegister />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'short' } })
    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    })
    expect(mockAuth.login).not.toHaveBeenCalled()
  })

  it('shows error when fullName is empty in register mode', async () => {
    render(<LoginRegister />)
    fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio para registrar')).toBeInTheDocument()
    })
    expect(mockAuth.register).not.toHaveBeenCalled()
  })

  it('calls login with correct credentials on valid submit', async () => {
    render(<LoginRegister />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('calls register with correct data on valid register submit', async () => {
    render(<LoginRegister />)
    fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockAuth.register).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User')
    })
  })

  it('disables submit button when loading', () => {
    mockAuth.loading = true
    render(<LoginRegister />)

    const button = screen.getByRole('button', { name: 'Cargando...' })
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Cargando...')
  })

  it('shows error from API when login fails', async () => {
    const apiError = { response: { data: { detail: 'Credenciales inválidas' } } }
    mockAuth.login.mockRejectedValue(apiError)

    render(<LoginRegister />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })
  })

  it('shows error from API when register fails (email already exists)', async () => {
    const apiError = { response: { data: { detail: 'El email ya está registrado' } } }
    mockAuth.register.mockRejectedValue(apiError)

    render(<LoginRegister />)
    fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } })
    const form = screen.getByTestId('login-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument()
    })
  })
})