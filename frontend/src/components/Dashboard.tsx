import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface VolumeDataPoint {
  week: string
  volume: number
  sessions: number
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  bgColor: string
}

function KPICard({ title, value, subtitle, icon, bgColor }: KPICardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function MetricIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
    </svg>
  )
}

function SessionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ReadinessIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3m4 7h-4m4 7h-4m-9 4V3m4 7h-4m4 7h-4M10 20v-3m4 0v-3m4 0v-3" />
    </svg>
  )
}

function OneRMIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export function Dashboard() {
  const { user } = useAuth()
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

  // KPI calculations
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0)
  const thisWeekSessions = data.length > 0 ? data[0].sessions : 0
  const thisWeekVolume = data.length > 0 ? data[0].volume : 0

  // Estimated 1RM for Squat (placeholder - would come from analytics in real app)
  const estimatedSquat1RM = 140 // kg - placeholder

  // Readiness Score (placeholder - would come from HRV/sleep data in real app)
  const readinessScore = 78 // placeholder

  if (!api.isAuthenticated()) {
    return (
      <section id="dashboard" className="mb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Volumen Semanal</h2>
          <p className="text-gray-500">Inicia sesión para ver tu progreso</p>
        </div>
      </section>
    )
  }

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const athleteName = user?.full_name || user?.email?.split('@')[0] || 'Atleta'

  return (
    <section id="dashboard" className="mb-12 bg-gray-50 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">{athleteName} · {today}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            En línea
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Volumen Esta Semana"
          value={`${thisWeekVolume.toLocaleString()} kg`}
          subtitle={`${thisWeekSessions} sesiones`}
          icon={<MetricIcon />}
          bgColor="bg-blue-50"
        />
        <KPICard
          title="1RM Estimado (Sentadilla)"
          value={`${estimatedSquat1RM} kg`}
          subtitle="Basado en última sesión"
          icon={<OneRMIcon />}
          bgColor="bg-purple-50"
        />
        <KPICard
          title="Readiness Score"
          value={readinessScore}
          subtitle="Listo para entrenar fuerte"
          icon={<ReadinessIcon />}
          bgColor="bg-emerald-50"
        />
        <KPICard
          title="Sesiones (12 sem)"
          value={totalSessions}
          subtitle={`${data.length} semanas con datos`}
          icon={<SessionIcon />}
          bgColor="bg-amber-50"
        />
      </div>

      {/* Volume Chart Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Volumen Semanal (últimas 12 semanas)</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              Volumen Total (kg)
            </span>
          </div>
        </div>

        {loading && (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-8">{error}</div>
        )}

        {data.length > 0 && !loading && (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickCount={5}
                tickFormatter={(value) => value.toLocaleString()}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  padding: '12px 16px',
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Volumen (kg)']}
                labelFormatter={(label: string) => `Semana ${label}`}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#3b82f6', fill: 'white' }}
                name="Volumen Total"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {data.length === 0 && !loading && (
          <div className="h-80 flex flex-col items-center justify-center text-gray-400 gap-3">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
            <p className="text-lg font-medium">No hay datos de entrenamiento aún</p>
            <p className="text-sm">Registra tu primera sesión abajo para ver tu progreso</p>
          </div>
        )}
      </div>
    </section>
  )
}