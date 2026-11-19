import { useState, FormEvent } from 'react'
import { api } from '../api/client'
import type { WorkoutSessionCreate, WorkoutSetCreate } from '../types'

interface SetFormData extends WorkoutSetCreate {
  tempId: number
}

// Tabla RPE simple para ajuste (basada en RTS)
const RPE_PERCENTAGES: Record<number, number> = {
  10: 1.00,
  9.5: 0.97,
  9: 0.93,
  8.5: 0.90,
  8: 0.87,
  7.5: 0.84,
  7: 0.81,
  6.5: 0.78,
  6: 0.75,
  5.5: 0.72,
  5: 0.70,
}

const calculateEpley1RM = (weight: number, reps: number): number => {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

const calculateRPEAdjusted1RM = (weight: number, reps: number, rpe?: number): number | null => {
  const epley1RM = calculateEpley1RM(weight, reps)
  if (!rpe) return null

  // Buscar el porcentaje más cercano en la tabla
  const rpeKeys = Object.keys(RPE_PERCENTAGES).map(Number).sort((a, b) => a - b)
  let closestRPE = rpeKeys[0]
  for (const key of rpeKeys) {
    if (key <= rpe) closestRPE = key
    else break
  }
  const percentage = RPE_PERCENTAGES[closestRPE]
  return epley1RM / percentage
}

export function LogWorkout() {
  const [sets, setSets] = useState<SetFormData[]>([{ tempId: 1, exercise_name: '', weight: 0, reps: 0, set_order: 0 }])
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  let nextTempId = 2

  const addSet = () => {
    setSets((prev) => [...prev, { tempId: nextTempId++, exercise_name: '', weight: 0, reps: 0, set_order: prev.length }])
  }

  const removeSet = (tempId: number) => {
    if (sets.length <= 1) return
    setSets((prev) => prev.filter((s) => s.tempId !== tempId).map((s, i) => ({ ...s, set_order: i })))
  }

  const updateSet = (tempId: number, field: keyof WorkoutSetCreate, value: string | number) => {
    setSets((prev) => prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!api.isAuthenticated()) {
      setMessage({ type: 'error', text: 'Debes iniciar sesión primero' })
      return
    }

    const validSets = sets.filter((s) => s.exercise_name.trim() && s.weight > 0 && s.reps > 0)
    if (validSets.length === 0) {
      setMessage({ type: 'error', text: 'Agrega al menos un set válido' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const payload: WorkoutSessionCreate = {
        date: new Date(date).toISOString(),
        notes: notes || undefined,
        sets: validSets.map(({ tempId, ...rest }) => rest),
      }
      await api.createWorkout(payload)
      setMessage({ type: 'success', text: '¡Entrenamiento guardado!' })
      // Reset form
      setSets([{ tempId: nextTempId++, exercise_name: '', weight: 0, reps: 0, set_order: 0 }])
      setNotes('')
      setDate(new Date().toISOString().slice(0, 16))
      // Trigger dashboard refresh (recargar página simple para MVP)
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error guardando el entrenamiento' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="log" className="mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrar Entrenamiento</h2>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cómo te sentiste, observaciones, etc."
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Series</h3>
              <button
                type="button"
                onClick={addSet}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Agregar serie
              </button>
            </div>

            <div className="space-y-3">
              {sets.map((set) => (
                <div key={set.tempId} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ejercicio *</label>
                    <input
                      type="text"
                      value={set.exercise_name}
                      onChange={(e) => updateSet(set.tempId, 'exercise_name', e.target.value)}
                      placeholder="Ej: Sentadilla, Press banca"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Peso (kg) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={set.weight}
                      onChange={(e) => updateSet(set.tempId, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {set.weight > 0 && set.reps > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-blue-600 font-medium">
                          1RM estimado (Epley): {calculateEpley1RM(set.weight, set.reps).toFixed(1)} kg
                        </p>
                        {set.rpe !== undefined && (
                          <p className="text-xs text-purple-600 font-medium mt-0.5">
                            Ajustado RPE {set.rpe}: {calculateRPEAdjusted1RM(set.weight, set.reps, set.rpe)?.toFixed(1) || '—'} kg
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Repeticiones *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={set.reps}
                      onChange={(e) => updateSet(set.tempId, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">RPE (1-10)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="10"
                      value={set.rpe !== undefined ? set.rpe : ''}
                      onChange={(e) => {
                        const val = e.target.value
                        updateSet(set.tempId, 'rpe', val ? parseFloat(val) : undefined as unknown as string | number)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeSet(set.tempId)}
                      disabled={sets.length <= 1}
                      className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando...' : 'Guardar Entrenamiento'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}