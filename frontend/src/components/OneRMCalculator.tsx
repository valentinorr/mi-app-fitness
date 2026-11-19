import { useState, FormEvent } from 'react'
import { api } from '../api/client'
import type { OneRMRequest, OneRMResponse, OneRMHistoryCreate } from '../types'

export function OneRMCalculator() {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('')
  const [exerciseName, setExerciseName] = useState('')
  const [result, setResult] = useState<OneRMResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    const rpeVal = rpe ? parseFloat(rpe) : undefined

    if (isNaN(w) || w <= 0) {
      setError('Ingresa un peso válido (kg)')
      return
    }
    if (isNaN(r) || r < 1 || r > 50) {
      setError('Repeticiones: 1 a 50')
      return
    }
    if (rpeVal !== undefined && (rpeVal < 1 || rpeVal > 10)) {
      setError('RPE: 1 a 10 (ej: 8.5)')
      return
    }

    setLoading(true)
    try {
      const payload: OneRMRequest = { weight: w, reps: r, rpe: rpeVal }
      const data = await api.calculate1RM(payload)
      setResult(data)
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error calculando 1RM'
      setError(Array.isArray(msg) ? msg[0]?.msg || msg : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setWeight('')
    setReps('')
    setRpe('')
    setExerciseName('')
    setResult(null)
    setError(null)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!result || !exerciseName.trim()) return

    setSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const payload: OneRMHistoryCreate = {
        exercise_name: exerciseName,
        weight: parseFloat(weight),
        reps: parseInt(reps, 10),
        rpe: rpe ? parseFloat(rpe) : undefined,
        estimated_1rm: result.estimated_1rm,
      }
      await api.save1RM(payload)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error guardando en historial'
      setError(Array.isArray(msg) ? msg[0]?.msg || msg : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="onerm" className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Calculadora de 1RM</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="exerciseName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del ejercicio *
            </label>
            <input
              id="exerciseName"
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Sentadilla, Press Banca, Peso Muerto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg) *
              </label>
              <input
                id="weight"
                type="number"
                step="0.5"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 100"
              />
            </div>
            <div>
              <label htmlFor="reps" className="block text-sm font-medium text-gray-700 mb-1">
                Repeticiones *
              </label>
              <input
                id="reps"
                type="number"
                min="1"
                max="50"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 5"
              />
            </div>
            <div>
              <label htmlFor="rpe" className="block text-sm font-medium text-gray-700 mb-1">
                RPE (opcional)
              </label>
              <input
                id="rpe"
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 8.5"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculando...' : 'Calcular 1RM'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Limpiar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-900">Resultado</h3>
                <button
                  onClick={handleSave}
                  disabled={saving || saveSuccess}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar en Historial'}
                </button>
              </div>

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                  ✓ 1RM guardado en el historial
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-3xl font-bold text-blue-600">{result.estimated_1rm.toFixed(1)} kg</p>
                  <p className="text-sm text-gray-500">1RM Estimado</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-3xl font-bold text-gray-600">{result.epley_1rm.toFixed(1)} kg</p>
                  <p className="text-sm text-gray-500">Epley (sin RPE)</p>
                </div>
                {result.rpe_adjusted_1rm && (
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-3xl font-bold text-purple-600">{result.rpe_adjusted_1rm.toFixed(1)} kg</p>
                    <p className="text-sm text-gray-500">Ajustado por RPE</p>
                  </div>
                )}
              </div>

              {result.rpe_percentage && (
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-gray-600">
                    RPE {rpe} ≈ <strong>{result.rpe_percentage}%</strong> de tu 1RM (tabla RTS)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Fórmula: {result.formula_used}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Porcentajes de entrenamiento (basado en 1RM estimado)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  {[
                    { label: '50%', pct: 0.50 },
                    { label: '60%', pct: 0.60 },
                    { label: '65%', pct: 0.65 },
                    { label: '70%', pct: 0.70 },
                    { label: '75%', pct: 0.75 },
                    { label: '80%', pct: 0.80 },
                    { label: '85%', pct: 0.85 },
                    { label: '90%', pct: 0.90 },
                    { label: '95%', pct: 0.95 },
                    { label: '100%', pct: 1.00 },
                  ].map(({ label, pct }) => (
                    <div key={label} className="text-center p-2 bg-white rounded border border-gray-200">
                      <p className="font-semibold text-gray-900">{(result.estimated_1rm * pct).toFixed(1)} kg</p>
                      <p className="text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}