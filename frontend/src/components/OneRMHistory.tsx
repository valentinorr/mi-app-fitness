import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { api } from '../api/client'
import type { OneRMHistoryResponse } from '../types'

export function OneRMHistory() {
  const [data, setData] = useState<OneRMHistoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exerciseFilter, setExerciseFilter] = useState<string>('')

  const fetchHistory = async () => {
    if (!api.isAuthenticated()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await api.get1RMHistory()
      const sorted = [...response].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setData(sorted)
      setError(null)
    } catch (err) {
      setError('Error cargando historial de 1RM')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const filteredData = exerciseFilter
    ? data.filter((d) => d.exercise_name.toLowerCase().includes(exerciseFilter.toLowerCase()))
    : data

  const uniqueExercises = [...new Set(data.map((d) => d.exercise_name))]

  const formatDate = (createdAt: string): string => {
    const date = new Date(createdAt)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (!api.isAuthenticated()) {
    return (
      <section id="history" className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Historial de 1RM</h2>
          <p className="text-gray-500">Inicia sesión para ver tu progreso</p>
        </div>
      </section>
    )
  }

  return (
    <section id="history" className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Historial de 1RM</h2>
          <select
            value={exerciseFilter}
            onChange={(e) => setExerciseFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los ejercicios</option>
            {uniqueExercises.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-8">{error}</div>
        )}

        {filteredData.length > 0 && !loading && (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="created_at"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={formatDate}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  label={{ value: '1RM Estimado (kg)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'estimated_1rm') return [value.toFixed(1) + ' kg', '1RM Estimado']
                    if (name === 'weight') return [value + ' kg', 'Peso levantado']
                    if (name === 'reps') return [value, 'Reps']
                    if (name === 'rpe') return [value, 'RPE']
                    return [value, name]
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="estimated_1rm"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: '#3b82f6' }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="1RM Estimado"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalle de registros</h3>
              <table className="w-full text-sm text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Fecha</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Ejercicio</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Peso (kg)</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Reps</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">RPE</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">1RM Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3">{formatDate(item.created_at)}</td>
                        <td className="py-2 px-3 font-medium">{item.exercise_name}</td>
                        <td className="py-2 px-3 text-right">{item.weight}</td>
                        <td className="py-2 px-3 text-right">{item.reps}</td>
                        <td className="py-2 px-3 text-right">{item.rpe ?? '—'}</td>
                        <td className="py-2 px-3 text-right font-semibold text-blue-600">{item.estimated_1rm.toFixed(1)} kg</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {filteredData.length === 0 && !loading && (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">No hay historial de 1RM aún</p>
              <p className="text-gray-500">Calcula y guarda tu primer 1RM en la <strong>Calculadora 1RM</strong></p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}