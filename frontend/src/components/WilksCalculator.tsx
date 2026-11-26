import { useState, FormEvent } from 'react'
import { Mars, Venus } from 'lucide-react'

// Coeficientes oficiales de Wilks (versión 2020)
// Fuente: IPF / World Powerlifting Federation
// Fórmula: Coeficiente = 500 / (a + b*x + c*x² + d*x³ + e*x⁴ + f*x⁵)
// Donde x = peso corporal en kg

const WILKS_COEFFICIENTS = {
  male: {
    a: -216.0475144,
    b: 16.2606339,
    c: -0.002388645,
    d: -0.00113732,
    e: 7.01863e-06,
    f: -1.291e-08,
  },
  female: {
    a: 594.31747775582,
    b: -27.23842536447,
    c: 0.82112226871,
    d: -0.00930733913,
    e: 4.731582e-05,
    f: -9.054e-08,
  },
}

interface WilksResult {
  coefficient: number
  wilksPoints: number
  bodyweight: number
  totalLifted: number
  sex: 'male' | 'female'
}

export function WilksCalculator() {
  const [bodyweight, setBodyweight] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [totalLifted, setTotalLifted] = useState('')
  const [result, setResult] = useState<WilksResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateWilksCoefficient = (bw: number, isMale: boolean): number => {
    const coeffs = isMale ? WILKS_COEFFICIENTS.male : WILKS_COEFFICIENTS.female
    const x = bw
    const x2 = x * x
    const x3 = x2 * x
    const x4 = x3 * x
    const x5 = x4 * x

    const denominator =
      coeffs.a +
      coeffs.b * x +
      coeffs.c * x2 +
      coeffs.d * x3 +
      coeffs.e * x4 +
      coeffs.f * x5

    return 500 / denominator
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const bw = parseFloat(bodyweight)
    const total = parseFloat(totalLifted)

    if (isNaN(bw) || bw <= 0) {
      setError('Ingresa un peso corporal válido (kg)')
      return
    }
    if (isNaN(total) || total <= 0) {
      setError('Ingresa un total levantado válido (kg)')
      return
    }
    if (bw > 300) {
      setError('Peso corporal máximo: 300 kg')
      return
    }

    setLoading(true)

    try {
      const coefficient = calculateWilksCoefficient(bw, sex === 'male')
      const wilksPoints = total * coefficient

      setResult({
        coefficient,
        wilksPoints,
        bodyweight: bw,
        totalLifted: total,
        sex,
      })
    } catch {
      setError('Error calculando puntos Wilks')
    } finally {
      setLoading(false)
    }
  }

  const getWilksInterpretation = (points: number): string => {
    if (points < 300) return 'Principiante - Sigue entrenando con consistencia'
    if (points < 350) return 'Intermedio - Buen nivel de fuerza'
    if (points < 400) return 'Avanzado - Nivel competitivo nacional'
    if (points < 450) return 'Élite - Nivel internacional'
    if (points < 500) return 'Clase mundial - Top mundial'
    return 'Legendario - De los mejores de la historia'
  }

  const getWilksClass = (points: number): string => {
    if (points < 300) return 'bg-gray-100 text-gray-700'
    if (points < 350) return 'bg-blue-100 text-blue-700'
    if (points < 400) return 'bg-green-100 text-green-700'
    if (points < 450) return 'bg-purple-100 text-purple-700'
    if (points < 500) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <section id="wilks" className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Calculadora de Puntos Wilks / IPF GL</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bodyweight" className="block text-sm font-medium text-gray-700 mb-1">
                Peso Corporal (kg) *
              </label>
              <input
                id="bodyweight"
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={bodyweight}
                onChange={(e) => setBodyweight(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 82.5"
              />
            </div>
            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                Sexo *
              </label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
            <div>
              <label htmlFor="totalLifted" className="block text-sm font-medium text-gray-700 mb-1">
                Total Levantado (kg) *
              </label>
              <input
                id="totalLifted"
                type="number"
                step="0.5"
                min="0"
                value={totalLifted}
                onChange={(e) => setTotalLifted(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 550 (SQ + BP + DL)"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculando...' : 'Calcular Puntos Wilks'}
            </button>
            <button
              type="button"
              onClick={() => {
                setBodyweight('')
                setTotalLifted('')
                setResult(null)
                setError(null)
              }}
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
            <div className={`bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 space-y-4 ${getWilksClass(result.wilksPoints)}`}>
              <div className="text-center">
                <p className="text-sm font-medium text-purple-700">Puntos Wilks</p>
                <p className="text-5xl font-bold text-purple-900">{result.wilksPoints.toFixed(1)}</p>
                <p className="text-sm text-purple-600">Wilks Points</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-900">{result.coefficient.toFixed(6)}</p>
                  <p className="text-xs text-purple-600">Coeficiente</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-900">{result.bodyweight} kg</p>
                  <p className="text-xs text-purple-600">Peso Corporal</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-900">{result.totalLifted} kg</p>
                  <p className="text-xs text-purple-600">Total Levantado</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex justify-center mb-1">
                    {result.sex === 'male' ? (
                      <Mars className="w-8 h-8 text-purple-900" aria-hidden="true" />
                    ) : (
                      <Venus className="w-8 h-8 text-purple-900" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs text-purple-600 text-center">{result.sex === 'male' ? 'Masculino' : 'Femenino'}</p>
                </div>
              </div>

              <div className="bg-white/30 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">¿Qué significa tu puntaje?</h4>
                <p className="text-purple-800">{getWilksInterpretation(result.wilksPoints)}</p>
              </div>

              <div className="bg-white/30 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Referencia de Categorías Wilks</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                  {[
                    { label: 'Principiante', range: '< 300', color: 'bg-gray-100 text-gray-700' },
                    { label: 'Intermedio', range: '300-349', color: 'bg-blue-100 text-blue-700' },
                    { label: 'Avanzado', range: '350-399', color: 'bg-green-100 text-green-700' },
                    { label: 'Élite', range: '400-449', color: 'bg-purple-100 text-purple-700' },
                    { label: 'Clase Mundial', range: '450-499', color: 'bg-yellow-100 text-yellow-700' },
                    { label: 'Legendario', range: '500+', color: 'bg-red-100 text-red-700' },
                  ].map(({ label, range, color }) => (
                    <div key={label} className={`${color} rounded px-2 py-1 text-center`}>
                      <p className="font-medium">{label}</p>
                      <p>{range}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/30 rounded-lg p-4 border border-purple-200 text-sm">
                <p className="text-purple-800">
                  <strong>Fórmula:</strong> Wilks Points = Total Levantado × Coeficiente<br />
                  <strong>Coeficiente:</strong> 500 / (a + b×BW + b×BW² + d×BW³ + e×BW⁴ + f×BW⁵)<br />
                  Coeficientes oficiales IPF 2020 para {result.sex === 'male' ? 'hombres' : 'mujeres'}.
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}