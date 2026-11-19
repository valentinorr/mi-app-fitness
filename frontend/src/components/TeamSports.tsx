import { useState, useEffect } from 'react'

type TabType = 'wellness' | 'acwr' | 'srpe'

interface WellnessResponse {
  sleep: number
  fatigue: number
  stress: number
  soreness: number
  mood: number
}

interface WellnessResult {
  score: number
  status: 'ready' | 'caution' | 'rest'
  message: string
  color: string
}

interface ACWRResult {
  ratio: number
  status: 'optimal' | 'caution' | 'high-risk' | 'low-stimulus'
  message: string
  color: string
}

interface SRPEData {
  rpe: number
  duration: number
  load: number
}

const WELLNESS_QUESTIONS = [
  { id: 'sleep', label: 'Calidad del sueno', help: 'Que tan bien dormiste anoche?' },
  { id: 'fatigue', label: 'Nivel de fatiga', help: 'Que tan cansado/a te sientes hoy?' },
  { id: 'stress', label: 'Estres general', help: 'Cuanto estres has tenido recientemente?' },
  { id: 'soreness', label: 'Dolor muscular (DOMS)', help: 'Cuanto dolor muscular tienes?' },
  { id: 'mood', label: 'Estado de animo', help: 'Como esta tu motivacion y animo?' },
]

export function TeamSports() {
  const [activeTab, setActiveTab] = useState<TabType>('wellness')

  // Wellness state
  const [wellnessAnswers, setWellnessAnswers] = useState<WellnessResponse>({
    sleep: 3,
    fatigue: 3,
    stress: 3,
    soreness: 3,
    mood: 3,
  })
  const [wellnessResult, setWellnessResult] = useState<WellnessResult | null>(null)

  // ACWR state
  const [acuteLoad, setAcuteLoad] = useState('')
  const [chronicLoad, setChronicLoad] = useState('')
  const [acwrResult, setAcwrResult] = useState<ACWRResult | null>(null)

  // sRPE state
  const [sessionRPE, setSessionRPE] = useState('')
  const [sessionDuration, setSessionDuration] = useState('')
  const [srpeHistory, setSrpeHistory] = useState<SRPEData[]>([])

  // Load sRPE history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teamsports-srpe-history')
    if (saved) {
      try {
        setSrpeHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('teamsports-srpe-history', JSON.stringify(srpeHistory))
  }, [srpeHistory])

  // Wellness calculation
  const calculateWellness = () => {
    // Invert fatigue, stress, soreness (higher = worse)
    // Keep sleep and mood as is (higher = better)
    const sleepScore = wellnessAnswers.sleep
    const moodScore = wellnessAnswers.mood
    const fatigueScore = 6 - wellnessAnswers.fatigue
    const stressScore = 6 - wellnessAnswers.stress
    const sorenessScore = 6 - wellnessAnswers.soreness

    const total = sleepScore + moodScore + fatigueScore + stressScore + sorenessScore
    const score = Math.round((total / 25) * 100)

    let status: WellnessResult['status']
    let message: string
    let color: string

    if (score >= 80) {
      status = 'ready'
      message = 'Listo para entrenar! Tu cuerpo esta bien recuperado.'
      color = 'green'
    } else if (score >= 60) {
      status = 'caution'
      message = 'Precaucion: Entrena con intensidad moderada. Considera reducir volumen.'
      color = 'yellow'
    } else {
      status = 'rest'
      message = 'Descanso recomendado: Prioriza recuperacion, sueno y nutricion.'
      color = 'red'
    }

    setWellnessResult({ score, status, message, color })
  }

  // ACWR calculation
  const calculateACWR = () => {
    const acute = parseFloat(acuteLoad)
    const chronic = parseFloat(chronicLoad)

    if (isNaN(acute) || isNaN(chronic) || chronic <= 0) {
      setAcwrResult({
        ratio: 0,
        status: 'optimal',
        message: 'Ingresa valores validos',
        color: 'gray',
      })
      return
    }

    const ratio = acute / chronic

    let status: ACWRResult['status']
    let message: string
    let color: string

    if (ratio < 0.8) {
      status = 'low-stimulus'
      message = `Ratio ${ratio.toFixed(2)}: Carga aguda muy baja. Riesgo de desentrenamiento. Aumenta carga gradualmente.`
      color = 'blue'
    } else if (ratio <= 1.0) {
      status = 'optimal'
      message = `Ratio ${ratio.toFixed(2)}: Zona optima (0.8-1.0). Buen equilibrio carga/recuperacion.`
      color = 'green'
    } else if (ratio <= 1.3) {
      status = 'caution'
      message = `Ratio ${ratio.toFixed(2)}: Zona de precaucion (1.0-1.3). Monitorea fatiga y recuperacion.`
      color = 'yellow'
    } else if (ratio <= 1.5) {
      status = 'high-risk'
      message = `Ratio ${ratio.toFixed(2)}: Alto riesgo (1.3-1.5). Reduce carga urgente, prioriza recuperacion.`
      color = 'orange'
    } else {
      status = 'high-risk'
      message = `Ratio ${ratio.toFixed(2)}: Riesgo muy alto (mayor a 1.5). Deten carga alta! Riesgo significativo de lesion.`
      color = 'red'
    }

    setAcwrResult({ ratio, status, message, color })
  }

  // sRPE calculation
  const addSRPE = () => {
    const rpe = parseFloat(sessionRPE)
    const duration = parseFloat(sessionDuration)

    if (isNaN(rpe) || rpe < 1 || rpe > 10) {
      alert('RPE debe ser entre 1 y 10')
      return
    }
    if (isNaN(duration) || duration <= 0) {
      alert('Duracion debe ser mayor a 0')
      return
    }

    const load = rpe * duration
    const newEntry: SRPEData = {
      rpe,
      duration,
      load,
    }

    setSrpeHistory(prev => [newEntry, ...prev].slice(0, 50))
    setSessionRPE('')
    setSessionDuration('')
  }

  const deleteSRPE = (index: number) => {
    setSrpeHistory(prev => prev.filter((_, i) => i !== index))
  }

  const weeklyLoad = srpeHistory.slice(0, 7).reduce((sum, s) => sum + s.load, 0)
  const avgDailyLoad = srpeHistory.length > 0
    ? Math.round(srpeHistory.slice(0, 7).reduce((sum, s) => sum + s.load, 0) / Math.min(7, srpeHistory.length))
    : 0

  return (
    <section id="teamsports" className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {[
              { id: 'wellness', label: 'Bienestar (Wellness)' },
              { id: 'acwr', label: 'ACWR Calculator' },
              { id: 'srpe', label: 'sRPE Calculator' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Wellness Tab */}
          {activeTab === 'wellness' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Cuestionario de Bienestar Diario</h3>
                <p className="text-sm text-blue-700">
                  Responde cada item en escala 1-5. Se recomienda completar cada manana antes del entrenamiento.
                </p>
              </div>

              <div className="space-y-5">
                {WELLNESS_QUESTIONS.map(q => (
                  <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <label className="block font-medium text-gray-900">{q.label}</label>
                        <p className="text-sm text-gray-500 mt-0.5">{q.help}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} className="flex flex-col items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={q.id}
                            value={val}
                            checked={wellnessAnswers[q.id as keyof WellnessResponse] === val}
                            onChange={() => setWellnessAnswers(prev => ({ ...prev, [q.id]: val }))}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={calculateWellness}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Calcular Readiness Score
                </button>

                {wellnessResult && (
                  <div className={`mt-6 p-6 rounded-lg border-2 ${
                    wellnessResult.color === 'green' ? 'bg-green-50 border-green-300' :
                    wellnessResult.color === 'yellow' ? 'bg-yellow-50 border-yellow-300' :
                    'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">Readiness Score</h3>
                      <div className={`text-4xl font-bold ${wellnessResult.color === 'green' ? 'text-green-600' : wellnessResult.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {wellnessResult.score}%
                      </div>
                    </div>
                    <p className={`text-lg font-medium ${wellnessResult.color === 'green' ? 'text-green-800' : wellnessResult.color === 'yellow' ? 'text-yellow-800' : 'text-red-800'}`}>
                      {wellnessResult.message}
                    </p>
                    <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                      {[
                        { label: 'Sueno', val: wellnessAnswers.sleep },
                        { label: 'Fatiga', val: wellnessAnswers.fatigue },
                        { label: 'Estres', val: wellnessAnswers.stress },
                        { label: 'Dolor', val: wellnessAnswers.soreness },
                        { label: 'Animo', val: wellnessAnswers.mood },
                      ].map(item => (
                        <div key={item.label} className="text-center p-2 bg-white/50 rounded">
                          <div className="font-bold text-gray-900">{item.val}/5</div>
                          <div className="text-gray-500">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACWR Tab */}
          {activeTab === 'acwr' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-purple-900 mb-2">Acute:Chronic Workload Ratio (ACWR)</h3>
                <p className="text-sm text-purple-700">
                  Ratio = Carga Aguda (semana actual) / Carga Cronica (promedio 4 semanas).
                  Zona optima: 0.8 - 1.3. 1.5 = alto riesgo de lesion.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carga Aguda (semana actual)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Suma de sRPE de los ultimos 7 dias</p>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Ej: 2800"
                    value={acuteLoad}
                    onChange={(e) => setAcuteLoad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carga Cronica (promedio 4 sem)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Promedio semanal de las ultimas 4 semanas</p>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Ej: 2500"
                    value={chronicLoad}
                    onChange={(e) => setChronicLoad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={calculateACWR}
                className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 mb-6"
              >
                Calcular ACWR
              </button>

              {acwrResult && (
                <div className={`p-6 rounded-lg border-2 ${
                  acwrResult.color === 'green' ? 'bg-green-50 border-green-300' :
                  acwrResult.color === 'yellow' ? 'bg-yellow-50 border-yellow-300' :
                  acwrResult.color === 'orange' ? 'bg-orange-50 border-orange-300' :
                  acwrResult.color === 'red' ? 'bg-red-50 border-red-300' :
                  'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">ACWR Ratio</h3>
                    <div className={`text-4xl font-bold ${acwrResult.color === 'green' ? 'text-green-600' : acwrResult.color === 'yellow' ? 'text-yellow-600' : acwrResult.color === 'orange' ? 'text-orange-600' : acwrResult.color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                      {acwrResult.ratio.toFixed(2)}
                    </div>
                  </div>
                  <p className={`text-lg font-medium ${acwrResult.color === 'green' ? 'text-green-800' : acwrResult.color === 'yellow' ? 'text-yellow-800' : acwrResult.color === 'orange' ? 'text-orange-800' : acwrResult.color === 'red' ? 'text-red-800' : 'text-blue-800'}`}>
                    {acwrResult.message}
                  </p>

                  <div className="mt-4 flex items-center gap-2 overflow-x-auto">
                    <div className="flex-1 h-4 bg-gray-200 rounded-full relative">
                      <div
                        className="absolute top-0 h-full bg-green-300 rounded-l-full"
                        style={{ width: '30%' }}
                      />
                      <div
                        className="absolute top-0 h-full bg-yellow-300"
                        style={{ left: '30%', width: '30%' }}
                      />
                      <div
                        className="absolute top-0 h-full bg-orange-300"
                        style={{ left: '60%', width: '15%' }}
                      />
                      <div
                        className="absolute top-0 h-full bg-red-300 rounded-r-full"
                        style={{ left: '75%', width: '25%' }}
                      />
                      {/* Indicator */}
                      <div
                        className="absolute top-[-4px] w-3 h-3 bg-gray-900 rounded-full transform -translate-x-1/2 border-2 border-white shadow"
                        style={{
                          left: `${Math.min(100, Math.max(0, (acwrResult.ratio / 2) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-500 w-24">
                      <span>0.8</span>
                      <span>1.0</span>
                      <span>1.3</span>
                      <span>1.5+</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Zona de referencia */}
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Zonas de Referencia ACWR</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {[
                    { label: 'Bajo estimulo', range: '< 0.8', color: 'bg-blue-100 text-blue-700', desc: 'Riesgo desentrenamiento' },
                    { label: 'Optimo', range: '0.8 - 1.0', color: 'bg-green-100 text-green-700', desc: 'Mejor adaptacion' },
                    { label: 'Precaucion', range: '1.0 - 1.3', color: 'bg-yellow-100 text-yellow-700', desc: 'Monitorear fatiga' },
                    { label: 'Alto riesgo', range: '1.3+', color: 'bg-red-100 text-red-700', desc: 'Riesgo lesion alto' },
                  ].map(zone => (
                    <div key={zone.label} className={`${zone.color} rounded-lg p-3`}>
                      <div className="font-semibold">{zone.label}</div>
                      <div className="font-mono text-lg">{zone.range}</div>
                      <div className="text-xs mt-1">{zone.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* sRPE Tab */}
          {activeTab === 'srpe' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-2">Calculadora sRPE (Session RPE)</h3>
                <p className="text-sm text-green-700">
                  Carga de entrenamiento = RPE de la sesion (1-10) x Duracion en minutos.
                  Util para cuantificar carga interna en deportes de equipo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RPE de la sesion (1-10)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    placeholder="Ej: 7.5"
                    value={sessionRPE}
                    onChange={(e) => setSessionRPE(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duracion (minutos)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Ej: 90"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={addSRPE}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Agregar Sesion
                </button>
              </div>

              {/* Resumen semanal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{weeklyLoad} AU</div>
                  <div className="text-sm text-green-600">Carga Semanal (7 dias)</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{avgDailyLoad} AU</div>
                  <div className="text-sm text-blue-600">Promedio Diario</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700">{srpeHistory.length}</div>
                  <div className="text-sm text-purple-600">Sesiones Registradas</div>
                </div>
              </div>

              {/* Tabla historial */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Historial de Sesiones (ultimas 50)</h4>
                {srpeHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay sesiones registradas aun</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">RPE</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">Duracion</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">Carga (AU)</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {srpeHistory.map((session, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                            <td className="py-2 px-3 font-medium text-gray-900">{session.rpe}</td>
                            <td className="py-2 px-3 text-right text-gray-700">{session.duration} min</td>
                            <td className="py-2 px-3 text-right font-semibold text-green-700">{session.load} AU</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => deleteSRPE(index)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tabla de referencia */}
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Referencia de Cargas sRPE</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Categoria</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">Carga Diaria (AU)</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">Carga Semanal (AU)</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Interpretacion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { cat: 'Muy Baja', daily: '< 200', weekly: '< 1000', desc: 'Recuperacion activa / Dia libre' },
                        { cat: 'Baja', daily: '200 - 350', weekly: '1000 - 2000', desc: 'Entrenamiento tecnico / Taper' },
                        { cat: 'Moderada', daily: '350 - 500', weekly: '2000 - 3000', desc: 'Entrenamiento estandar' },
                        { cat: 'Alta', daily: '500 - 700', weekly: '3000 - 4500', desc: 'Carga intensa / Pre-competencia' },
                        { cat: 'Muy Alta', daily: '700+', weekly: '4500+', desc: 'Sobrecarga planificada / Shock' },
                      ].map(row => (
                        <tr key={row.cat} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-medium text-gray-900">{row.cat}</td>
                          <td className="py-2 px-3 text-right text-gray-700">{row.daily}</td>
                          <td className="py-2 px-3 text-right text-gray-700">{row.weekly}</td>
                          <td className="py-2 px-3 text-gray-600">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}