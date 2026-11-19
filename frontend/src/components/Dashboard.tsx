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

interface VolumeDataPoint {
  week: string
  volume: number
  sessions: number
}

export function Dashboard() {
  const [data, setData] = useState<VolumeDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVolume = async () => {
    if (!api.isAuthenticated()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await api.getWeeklyVolume(12)
      const formatted = response.map((item) => ({
        week: formatWeekLabel(item.week_start),
        volume: item.total_volume,
        sessions: item.sessions_count,
      }))
      setData(formatted)
      setError(null)
    } catch (err) {
      setError('Error cargando datos de volumen')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVolume()
  }, [])

  const formatWeekLabel = (weekStr: string): string => {
    const [year, week] = weekStr.split('-')
    return `S${week}/${year.slice(2)}`
  }

  if (!api.isAuthenticated()) {
    return (
      <section id="dashboard" className="mb-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Volumen Semanal</h2>
          <p className="text-gray-500">Inicia sesión para ver tu progreso</p>
        </div>
      </section>
    )
  }

  return (
    <section id="dashboard" className="mb-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Volumen Semanal (últimas 12 semanas)</h2>

        {loading && (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-8">{error}</div>
        )}

        {data.length > 0 && !loading && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Volumen (kg)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Volumen (kg)']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                name="Volumen Total"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {data.length === 0 && !loading && (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>No hay datos de entrenamiento aún. ¡Registra tu primera sesión abajo!</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-3xl font-bold text-blue-600">
              {data.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Volumen Total</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-3xl font-bold text-green-600">
              {data.reduce((sum, d) => sum + d.sessions, 0)}
            </p>
            <p className="text-sm text-gray-500">Sesiones Totales</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-3xl font-bold text-purple-600">
              {data.length > 0
                ? (data.reduce((sum, d) => sum + d.volume, 0) / data.length).toFixed(0)
                : 0}
            </p>
            <p className="text-sm text-gray-500">Promedio/Semana</p>
          </div>
        </div>
      </div>
    </section>
  )
}