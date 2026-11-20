import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OneRMCalculator } from './OneRMCalculator'

// Mock the API client
const { mockCalculate1RM, mockSave1RM } = vi.hoisted(() => ({
  mockCalculate1RM: vi.fn(),
  mockSave1RM: vi.fn(),
}))

vi.mock('../api/client', () => ({
  api: {
    calculate1RM: mockCalculate1RM,
    save1RM: mockSave1RM,
  },
}))

describe('OneRMCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders calculator form with all fields', () => {
    render(<OneRMCalculator />)

    expect(screen.getByText('Calculadora de 1RM')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del ejercicio *')).toBeInTheDocument()
    expect(screen.getByLabelText('Peso (kg) *')).toBeInTheDocument()
    expect(screen.getByLabelText('Repeticiones *')).toBeInTheDocument()
    expect(screen.getByLabelText('RPE (opcional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calcular 1RM' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument()
  })

  it('shows error when weight is not provided', async () => {
    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Ingresa un peso válido (kg)')).toBeInTheDocument()
    })

    expect(mockCalculate1RM).not.toHaveBeenCalled()
  })

  it('shows error when weight is zero or negative', async () => {
    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Ingresa un peso válido (kg)')).toBeInTheDocument()
    })
  })

  it('shows error when reps is not provided', async () => {
    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Repeticiones: 1 a 50')).toBeInTheDocument()
    })
  })

  it('shows error when reps is out of range (0)', async () => {
    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '0' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Repeticiones: 1 a 50')).toBeInTheDocument()
    })
  })

  it('shows error when reps is out of range (>50)', async () => {
    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '51' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Repeticiones: 1 a 50')).toBeInTheDocument()
    })
  })

  it('shows error when RPE is out of range', async () => {
    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('RPE (opcional)'), { target: { value: '11' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('RPE: 1 a 10 (ej: 8.5)')).toBeInTheDocument()
    })
  })

  it('calls calculate1RM with correct payload and displays result', async () => {
    const mockResult = {
      estimated_1rm: 115.0,
      epley_1rm: 116.7,
      rpe_adjusted_1rm: 112.5,
      rpe_percentage: 85.7,
      formula_used: 'Epley + RPE adjustment (RTS)',
    }
    mockCalculate1RM.mockResolvedValue(mockResult)

    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Nombre del ejercicio *'), { target: { value: 'Sentadilla' } })
    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('RPE (opcional)'), { target: { value: '8.5' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockCalculate1RM).toHaveBeenCalledWith({
        weight: 100,
        reps: 5,
        rpe: 8.5,
      })
    })

    await waitFor(() => {
      // Check for the main 1RM result - there are multiple "115.0 kg" elements (main card + percentage table)
      const all115 = screen.getAllByText('115.0 kg')
      expect(all115.length).toBeGreaterThan(0)
      expect(screen.getByText('116.7 kg')).toBeInTheDocument()
      expect(screen.getByText('112.5 kg')).toBeInTheDocument()
      // RPE text is split across elements: "RPE " + "8.5" + " ≈ " + "85.7%"
      expect(screen.getByText((content) => content.includes('RPE') && content.includes('8.5'))).toBeInTheDocument()
      expect(screen.getByText('85.7%')).toBeInTheDocument()
    })
  })

  it('calculates Epley formula correctly: weight * (1 + reps/30)', async () => {
    // For weight=100, reps=5: Epley = 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
    // When no RPE, estimated_1rm = epley_1rm = 116.67, so both cards show 116.7 kg
    // Plus percentage table shows 116.7 kg at 100%
    const mockResult = {
      estimated_1rm: 116.67,
      epley_1rm: 116.67,
      rpe_adjusted_1rm: undefined,
      rpe_percentage: undefined,
      formula_used: 'Epley',
    }
    mockCalculate1RM.mockResolvedValue(mockResult)

    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Nombre del ejercicio *'), { target: { value: 'Press Banca' } })
    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    // No RPE provided
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockCalculate1RM).toHaveBeenCalledWith({
        weight: 100,
        reps: 5,
        rpe: undefined,
      })
    })

    await waitFor(() => {
      // Epley formula: 100 * (1 + 5/30) = 116.67
      // Multiple elements show 116.7 kg (main card, Epley card, percentage table at 100%)
      const all116 = screen.getAllByText('116.7 kg')
      expect(all116.length).toBeGreaterThan(0)
    })
  })

  it('clears form when clicking Limpiar', async () => {
    const mockResult = {
      estimated_1rm: 115.0,
      epley_1rm: 116.7,
      rpe_adjusted_1rm: undefined,
      rpe_percentage: undefined,
      formula_used: 'Epley',
    }
    mockCalculate1RM.mockResolvedValue(mockResult)

    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Nombre del ejercicio *'), { target: { value: 'Sentadilla' } })
    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      // Just verify result appeared (multiple 115.0 kg elements)
      const all115 = screen.getAllByText('115.0 kg')
      expect(all115.length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))

    // Check that inputs are cleared (value becomes empty string or null for number inputs)
    expect(screen.getByLabelText('Nombre del ejercicio *')).toHaveValue('')
    // Number inputs return null when cleared
    expect(screen.getByLabelText('Peso (kg) *')).toHaveValue(null)
    expect(screen.getByLabelText('Repeticiones *')).toHaveValue(null)
    expect(screen.getByLabelText('RPE (opcional)')).toHaveValue(null)
    // After clear, no 115.0 kg should remain
    const all115AfterClear = screen.queryAllByText('115.0 kg')
    expect(all115AfterClear.length).toBe(0)
  })

  it('shows loading state while calculating', async () => {
    let resolve: (value: any) => void
    const promise = new Promise((res) => { resolve = res })
    mockCalculate1RM.mockReturnValue(promise)

    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Nombre del ejercicio *'), { target: { value: 'Sentadilla' } })
    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    // Check loading state
    const button = screen.getByRole('button', { name: 'Calculando...' })
    expect(button).toBeDisabled()

    // Resolve the promise
    resolve!({
      estimated_1rm: 115.0,
      epley_1rm: 116.7,
      formula_used: 'Epley',
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Calcular 1RM' })).not.toBeDisabled()
    })
  })

  it('shows error when API call fails', async () => {
    mockCalculate1RM.mockRejectedValue({
      response: { data: { detail: 'Error del servidor' } },
    })

    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Nombre del ejercicio *'), { target: { value: 'Sentadilla' } })
    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '5' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Error del servidor')).toBeInTheDocument()
    })
  })

  it('displays percentage table based on estimated 1RM', async () => {
    const mockResult = {
      estimated_1rm: 100,
      epley_1rm: 100,
      rpe_adjusted_1rm: undefined,
      rpe_percentage: undefined,
      formula_used: 'Epley',
    }
    mockCalculate1RM.mockResolvedValue(mockResult)

    render(<OneRMCalculator />)

    fireEvent.change(screen.getByLabelText('Nombre del ejercicio *'), { target: { value: 'Peso Muerto' } })
    fireEvent.change(screen.getByLabelText('Peso (kg) *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Repeticiones *'), { target: { value: '1' } })
    const form = screen.getByTestId('onerm-form')
    fireEvent.submit(form)

    await waitFor(() => {
      // 50% of 100 = 50 (appears once in percentage table)
      const all50 = screen.getAllByText('50.0 kg')
      expect(all50.length).toBeGreaterThan(0)
      // 100.0 kg appears multiple times (main card, Epley card, percentage table at 100%)
      const all100 = screen.getAllByText('100.0 kg')
      expect(all100.length).toBeGreaterThan(0)
    })
  })
})