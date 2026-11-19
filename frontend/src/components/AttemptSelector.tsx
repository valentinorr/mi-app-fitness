import { useState, FormEvent } from 'react'

interface AttemptPlan {
  opener: number
  second: number
  third: number
}

export function AttemptSelector() {
  const [oneRM, setOneRM] = useState('')
  const [attempts, setAttempts] = useState<AttemptPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Redondear al múltiplo de 2.5 kg más cercano (regla IPF)
  const roundToIPF = (weight: number): number => {
    return Math.round(weight / 2.5) * 2.5
  }

  // Calcular intentos según reglas estándar de powerlifting
  const calculateAttempts = (rm: number): AttemptPlan => {
    // Rangos estándar para competencia
    const openerPct = 0.91      // 91% (medio entre 90-92%)
    const secondPct = 0.97      // 97% (medio entre 96-98%)
    const thirdPct = 1.01       // 101% (medio entre 100-102%)

    return {
      opener: roundToIPF(rm * openerPct),
      second: roundToIPF(rm * secondPct),
      third: roundToIPF(rm * thirdPct),
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const rm = parseFloat(oneRM)
    if (isNaN(rm) || rm <= 0) {
      setError('Ingresa un 1RM válido (kg)')
      return
    }

    const plan = calculateAttempts(rm)
    setAttempts(plan)
  }

  const handleUseCalculator1RM = () => {
    setOneRM('')
    setAttempts(null)
  }

  return (
    <section id="attempts" className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Selector de Intentos (Meet Prep)</h2>
          <button
            type="button"
            onClick={handleUseCalculator1RM}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            title="Usar 1RM de la calculadora anterior"
          >
            ← Usar 1RM de la calculadora
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="oneRM" className="block text-sm font-medium text-gray-700 mb-1">
              1RM Actual (kg) *
            </label>
            <input
              id="oneRM"
              type="number"
              step="0.5"
              min="0"
              value={oneRM}
              onChange={(e) => setOneRM(e.target.value)}
              required
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 180"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Calcular Intentos
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {attempts && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-green-900">Plan de Intentos para Competencia</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Intento 1 - Apertura */}
                <div className="bg-white rounded-lg p-5 border border-green-100 relative">
                  <div className="absolute -top-3 left-4 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    1er INTENTO (Apertura)
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-4xl font-bold text-green-700">{attempts.opener.toFixed(1)} kg</p>
                    <p className="text-sm text-gray-500 mt-1">~91% del 1RM</p>
                    <p className="text-xs text-gray-400 mt-2">Conservador para asegurar puntos</p>
                  </div>
                </div>

                {/* Intento 2 */}
                <div className="bg-white rounded-lg p-5 border border-green-100 relative">
                  <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    2do INTENTO
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-4xl font-bold text-blue-700">{attempts.second.toFixed(1)} kg</p>
                    <p className="text-sm text-gray-500 mt-1">~97% del 1RM</p>
                    <p className="text-xs text-gray-400 mt-2">Progresión agresiva pero segura</p>
                  </div>
                </div>

                {/* Intento 3 */}
                <div className="bg-white rounded-lg p-5 border border-green-100 relative">
                  <div className="absolute -top-3 left-4 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    3er INTENTO (PR/Record)
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-4xl font-bold text-purple-700">{attempts.third.toFixed(1)} kg</p>
                    <p className="text-sm text-gray-500 mt-1">~101% del 1RM</p>
                    <p className="text-xs text-gray-400 mt-2">Intento por récord personal</p>
                  </div>
                </div>
              </div>

              {/* Resumen y consejos */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Consejos para el día de la competencia</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><span className="text-green-600">✓</span> El <strong>apertura</strong> debe ser un peso que puedas hacer con seguridad incluso en un mal día (2-3 reps en el gym).</li>
                  <li className="flex items-start gap-2"><span className="text-blue-600">✓</span> El <strong>segundo</strong> te acerca a tu mejor marca de entrenamiento.</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600">✓</span> El <strong>tercero</strong> es para romper tu PR. Si fallas el 2do, puedes repetirlo o subir poco.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-600">⚠</span> Recuerda: <strong>solo 3 intentos por levantamiento</strong>. No hay 4to intento.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-600">⚠</span> Los pesos se redondean a <strong>múltiplos de 2.5 kg</strong> (regla IPF).</li>
                  <li className="flex items-start gap-2"><span className="text-gray-600">💡</span> Ajusta los porcentajes según tu experiencia: novatos más conservadores (88-90%), élites más agresivos (93-95% apertura).</li>
                </ul>
              </div>

              {/* Tabla de referencia rápida */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Referencia rápida: Porcentajes comunes</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-600">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Intento</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Conservador</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Estándar</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Agresivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">Apertura (1º)</td>
                        <td className="py-2 px-3">{roundToIPF(oneRM ? parseFloat(oneRM) * 0.88 : 0).toFixed(1)} kg (88%)</td>
                        <td className="py-2 px-3 font-semibold">{roundToIPF(oneRM ? parseFloat(oneRM) * 0.91 : 0).toFixed(1)} kg (91%)</td>
                        <td className="py-2 px-3">{roundToIPF(oneRM ? parseFloat(oneRM) * 0.93 : 0).toFixed(1)} kg (93%)</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">Segundo (2º)</td>
                        <td className="py-2 px-3">{roundToIPF(oneRM ? parseFloat(oneRM) * 0.94 : 0).toFixed(1)} kg (94%)</td>
                        <td className="py-2 px-3 font-semibold">{roundToIPF(oneRM ? parseFloat(oneRM) * 0.97 : 0).toFixed(1)} kg (97%)</td>
                        <td className="py-2 px-3">{roundToIPF(oneRM ? parseFloat(oneRM) * 0.99 : 0).toFixed(1)} kg (99%)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">Tercero (3º)</td>
                        <td className="py-2 px-3">{roundToIPF(oneRM ? parseFloat(oneRM) * 0.98 : 0).toFixed(1)} kg (98%)</td>
                        <td className="py-2 px-3 font-semibold">{roundToIPF(oneRM ? parseFloat(oneRM) * 1.01 : 0).toFixed(1)} kg (101%)</td>
                        <td className="py-2 px-3">{roundToIPF(oneRM ? parseFloat(oneRM) * 1.03 : 0).toFixed(1)} kg (103%)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}