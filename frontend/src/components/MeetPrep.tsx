import { useState, useEffect } from 'react'

type TabType = 'taper' | 'checklist' | 'warmup'

interface TaperWeek {
  week: number
  label: string
  dateRange: string
  squat: { weight: number; sets: number; reps: number; rpe: number }[]
  bench: { weight: number; sets: number; reps: number; rpe: number }[]
  deadlift: { weight: number; sets: number; reps: number; rpe: number }[]
  notes: string
}

interface ChecklistItem {
  id: string
  category: string
  item: string
  required: boolean
  checked: boolean
}

interface WarmupSet {
  label: string
  percentage: number
  weight: number
  reps: number
  rest: string
  notes: string
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Documentación
  { id: 'doc-1', category: 'Documentación', item: 'Carnet de federado / licencia', required: true, checked: false },
  { id: 'doc-2', category: 'Documentación', item: 'DNI / Pasaporte', required: true, checked: false },
  { id: 'doc-3', category: 'Documentación', item: 'Certificado médico (si requiere)', required: false, checked: false },
  { id: 'doc-4', category: 'Documentación', item: 'Confirmación de inscripción / hoja de intentos', required: true, checked: false },

  // Equipamiento - Obligatorio
  { id: 'eq-1', category: 'Equipamiento (Obligatorio)', item: 'Singlet / maillot de competencia', required: true, checked: false },
  { id: 'eq-2', category: 'Equipamiento (Obligatorio)', item: 'Camiseta interior (sin logos, color sólido)', required: true, checked: false },
  { id: 'eq-3', category: 'Equipamiento (Obligatorio)', item: 'Calcetines largos (para peso muerto)', required: true, checked: false },
  { id: 'eq-4', category: 'Equipamiento (Obligatorio)', item: 'Zapatillas de sentadilla / peso muerto', required: true, checked: false },

  // Equipamiento - Opcional pero recomendado
  { id: 'eq-5', category: 'Equipamiento (Recomendado)', item: 'Cinturón de potencia (10-13mm, IPF approved)', required: false, checked: false },
  { id: 'eq-6', category: 'Equipamiento (Recomendado)', item: 'Rodilleras / sleeves (IPF approved)', required: false, checked: false },
  { id: 'eq-7', category: 'Equipamiento (Recomendado)', item: 'Manguito de muñeca / wrist wraps', required: false, checked: false },
  { id: 'eq-8', category: 'Equipamiento (Recomendado)', item: 'Magnesio (polvo o líquido)', required: false, checked: false },
  { id: 'eq-9', category: 'Equipamiento (Recomendado)', item: 'Taloneras / heel inserts (si usas)', required: false, checked: false },

  // Nutrición e Hidratación
  { id: 'nut-1', category: 'Nutrición e Hidratación', item: 'Agua / electrolitos (mínimo 2-3L)', required: true, checked: false },
  { id: 'nut-2', category: 'Nutrición e Hidratación', item: 'Comida ligera entre intentos (banana, arroz, mermelada)', required: true, checked: false },
  { id: 'nut-3', category: 'Nutrición e Hidratación', item: 'Gel / carbohidratos rápidos', required: false, checked: false },
  { id: 'nut-4', category: 'Nutrición e Hidratación', item: 'Cafeína / pre-entreno (si usas)', required: false, checked: false },
  { id: 'nut-5', category: 'Nutrición e Hidratación', item: 'Post-competencia: proteína + carbohidratos', required: false, checked: false },

  // Recuperación y Varios
  { id: 'rec-1', category: 'Recuperación y Varios', item: 'Rodillo de espuma / bola de lacrosse', required: false, checked: false },
  { id: 'rec-2', category: 'Recuperación y Varios', item: 'Toalla', required: true, checked: false },
  { id: 'rec-3', category: 'Recuperación y Varios', item: 'Ropa de cambio cómoda', required: true, checked: false },
  { id: 'rec-4', category: 'Recuperación y Varios', item: 'Cargador de móvil / powerbank', required: false, checked: false },
  { id: 'rec-5', category: 'Recuperación y Varios', item: 'Dinero en efectivo / tarjeta', required: false, checked: false },
]

const generateTaperPlan = (meetDate: Date, squat1RM: number, bench1RM: number, deadlift1RM: number): TaperWeek[] => {
  const weeks = [3, 2, 1]

  return weeks.map((week, idx) => {
    const weekStart = new Date(meetDate)
    weekStart.setDate(weekStart.getDate() - (week * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    const dateRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`

    const taperPct = [0.75, 0.55, 0.35][idx]
    const volumePct = [0.7, 0.5, 0.3][idx]

    const getSets = (lift1RM: number, isMain: boolean) => {
      const basePct = isMain ? taperPct : taperPct * 0.9
      const weight = Math.round(lift1RM * basePct / 2.5) * 2.5
      const sets = Math.max(1, Math.round(3 * volumePct))
      const reps = week === 3 ? 3 : week === 2 ? 2 : 1
      const rpe = week === 3 ? 7 : week === 2 ? 6 : 5

      return Array(sets).fill(null).map(() => ({
        weight,
        sets: 1,
        reps,
        rpe,
      }))
    }

    const labels = ['Semana 3 (Carga moderada)', 'Semana 2 (Carga ligera)', 'Semana 1 (Semana de competencia)']

    return {
      week,
      label: labels[idx],
      dateRange,
      squat: getSets(squat1RM, true),
      bench: getSets(bench1RM, true),
      deadlift: getSets(deadlift1RM, false),
      notes: week === 3
        ? 'Mantén intensidad, reduce volumen. Enfócate en técnica y velocidad.'
        : week === 2
        ? 'Reduce significativamente volumen. Prioriza recuperación y sueño.'
        : 'Semana de competencia. Solo trabajo técnico muy ligero. Descansa bien.',
    }
  })
}

const generateWarmup = (openerWeight: number): WarmupSet[] => {
  if (openerWeight <= 0) return []

  const barWeight = 20
  const percentages = [0, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]

  let adjustedPcts = percentages
  if (openerWeight < 100) {
    adjustedPcts = [0, 0.4, 0.55, 0.7, 0.85, 0.95]
  } else if (openerWeight > 200) {
    adjustedPcts = [0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95]
  }

  return adjustedPcts.map((pct, idx) => {
    let weight: number
    let reps: number
    let rest: string
    let notes: string

    if (pct === 0) {
      weight = barWeight
      reps = 10
      rest = '1-2 min'
      notes = 'Barra vacía - técnica, movilidad'
    } else if (pct <= 0.4) {
      weight = Math.round(openerWeight * pct / 2.5) * 2.5
      reps = 8
      rest = '2-3 min'
      notes = 'Activación, ritmo controlado'
    } else if (pct <= 0.6) {
      weight = Math.round(openerWeight * pct / 2.5) * 2.5
      reps = 5
      rest = '3-4 min'
      notes = 'Construcción de confianza'
    } else if (pct <= 0.8) {
      weight = Math.round(openerWeight * pct / 2.5) * 2.5
      reps = 3
      rest = '4-5 min'
      notes = 'Acercamiento a peso de trabajo'
    } else if (pct <= 0.9) {
      weight = Math.round(openerWeight * pct / 2.5) * 2.5
      reps = 1
      rest = '5-6 min'
      notes = 'Último calentamiento pesado'
    } else {
      weight = Math.round(openerWeight * pct / 2.5) * 2.5
      reps = 1
      rest = '5-8 min'
      notes = 'Simulación de intento - velocidad máxima'
    }

    if (weight > openerWeight) weight = openerWeight

    const labels = ['Barra', '40%', '50%', '60%', '70%', '80%', '85%', '90%', '95%', '97%']
    const label = labels[idx] || `${Math.round(pct * 100)}%`

    return { label, percentage: pct, weight, reps, rest, notes }
  }).filter(w => w.weight <= openerWeight)
}

export function MeetPrep() {
  const [activeTab, setActiveTab] = useState<TabType>('taper')
  const [meetDate, setMeetDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 21)
    return d.toISOString().slice(0, 10)
  })
  const [squat1RM, setSquat1RM] = useState('')
  const [bench1RM, setBench1RM] = useState('')
  const [deadlift1RM, setDeadlift1RM] = useState('')
  const [taperPlan, setTaperPlan] = useState<TaperWeek[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>(CHECKLIST_ITEMS)
  const [openerWeight, setOpenerWeight] = useState('')
  const [warmupPlan, setWarmupPlan] = useState<WarmupSet[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('meetprep-checklist')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setChecklist(prev => prev.map(item => ({
          ...item,
          checked: parsed[item.id] ?? false
        })))
      } catch {}
    }
  }, [])

  useEffect(() => {
    const toSave: Record<string, boolean> = {}
    checklist.forEach(item => {
      toSave[item.id] = item.checked
    })
    localStorage.setItem('meetprep-checklist', JSON.stringify(toSave))
  }, [checklist])

  // Handler functions for explicit calculation
  const handleCalculateTaper = () => {
    if (meetDate && squat1RM && bench1RM && deadlift1RM) {
      const plan = generateTaperPlan(
        new Date(meetDate),
        parseFloat(squat1RM),
        parseFloat(bench1RM),
        parseFloat(deadlift1RM)
      )
      setTaperPlan(plan)
    }
  }

  const handleCalculateWarmup = () => {
    if (openerWeight) {
      const plan = generateWarmup(parseFloat(openerWeight))
      setWarmupPlan(plan)
    } else {
      setWarmupPlan([])
    }
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const getProgress = () => {
    const required = checklist.filter(i => i.required)
    const checked = required.filter(i => i.checked)
    return Math.round((checked.length / required.length) * 100)
  }

  const renderTaperPlan = () => {
    const allFieldsFilled = meetDate && squat1RM && bench1RM && deadlift1RM

    if (taperPlan.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Completa los datos y pulsa <strong>Calcular Plan</strong> para generar tu taper</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-4">
            <input
              type="date"
              value={meetDate}
              onChange={(e) => setMeetDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              step="0.5"
              placeholder="Sentadilla 1RM (kg)"
              value={squat1RM}
              onChange={(e) => setSquat1RM(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              step="0.5"
              placeholder="Press Banca 1RM (kg)"
              value={bench1RM}
              onChange={(e) => setBench1RM(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              step="0.5"
              placeholder="Peso Muerto 1RM (kg)"
              value={deadlift1RM}
              onChange={(e) => setDeadlift1RM(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={handleCalculateTaper}
            disabled={!allFieldsFilled}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Calcular Plan
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Principios del Taper (3 Semanas)</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Intensidad alta, volumen baja:</strong> Mantén pesos cercanos a competencia, reduce series/reps</li>
            <li>• <strong>Frecuencia:</strong> 3-4 sesiones/semana, última sesión 3-4 días antes del meet</li>
            <li>• <strong>Sueño y nutrición:</strong> Prioriza 8-9h sueño, carbohidratos altos, hidratación</li>
            <li>• <strong>Semana 1 (competencia):</strong> Solo trabajo técnico muy ligero (30-40% 1RM)</li>
          </ul>
        </div>

        <div className="space-y-4">
          {taperPlan.map((week) => (
            <div key={week.week} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{week.label}</h4>
                    <p className="text-sm text-gray-600">{week.dateRange}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4 italic">{week.notes}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Sentadilla', sets: week.squat },
                    { name: 'Press Banca', sets: week.bench },
                    { name: 'Peso Muerto', sets: week.deadlift },
                  ].map(({ name, sets }) => (
                    <div key={name} className="bg-gray-50 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 mb-2 capitalize">{name}</h5>
                      {sets.map((set, i) => (
                        <div key={i} className="text-sm text-gray-700">
                          {set.sets}×{set.reps} @ {set.weight}kg (RPE {set.rpe})
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderChecklist = () => {
    const progress = getProgress()
    const categories = [...new Set(checklist.map(i => i.category))]

    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-900">Progreso: {progress}% completado</h4>
            <div className="w-48 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-green-700">
            {checklist.filter(i => i.required && i.checked).length} de {checklist.filter(i => i.required).length} elementos obligatorios listos
          </p>
        </div>

        {categories.map(category => (
          <div key={category} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <h4 className="font-semibold text-gray-900">{category}</h4>
            </div>
            <div className="p-2 space-y-2">
              {checklist
                .filter(i => i.category === category)
                .map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.item}
                    </span>
                    {item.required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Obligatorio</span>
                    )}
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderWarmup = () => {
    if (warmupPlan.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h4 className="font-semibold text-gray-900 mb-4">Calculadora de Calentamiento</h4>
          <p className="text-gray-500 mb-6">Ingresa tu peso de apertura (primer intento) y pulsa <strong>Calcular Calentamiento</strong></p>
          <div className="max-w-xs mx-auto">
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="Peso de apertura (kg)"
                value={openerWeight}
                onChange={(e) => setOpenerWeight(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleCalculateWarmup}
                disabled={!openerWeight}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Calcular
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Ej: Si tu 1RM es 180kg y vas a abrir con 160kg, ingresa 160</p>
          </div>
        </div>
      )
    }

    const totalVolume = warmupPlan.reduce((sum, s) => sum + s.weight * s.reps, 0)

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-purple-900">Progresión de Calentamiento</h4>
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-purple-700">
                <span>Apertura: {openerWeight}kg</span>
                <span>Total sets: {warmupPlan.length}</span>
                <span>Volumen aprox: {totalVolume}kg</span>
              </div>
            </div>
            <button
              onClick={handleCalculateWarmup}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Recalcular
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Set</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">% 1RM</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Peso (kg)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Reps</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Descanso</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Notas</th>
              </tr>
            </thead>
            <tbody>
              {warmupPlan.map((set, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-900">{set.label}</td>
                  <td className="py-2 px-3 text-purple-600">{Math.round(set.percentage * 100)}%</td>
                  <td className="py-2 px-3 text-right font-semibold text-gray-900">{set.weight}kg</td>
                  <td className="py-2 px-3 text-right text-gray-700">{set.reps}</td>
                  <td className="py-2 px-3 text-gray-600">{set.rest}</td>
                  <td className="py-2 px-3 text-gray-500">{set.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-3">Consejos para el Calentamiento en Competencia</h4>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• <strong>Tiempo total:</strong> 45-60 min antes de tu primer intento. Planifica hacia atrás.</li>
            <li>• <strong>Orden:</strong> Sentadilla → Press Banca → Peso Muerto (cada uno con su calentamiento).</li>
            <li>• <strong>Intentos fallidos:</strong> Si fallas apertura, repite mismo peso. Si pasas, sube 2.5-5kg.</li>
            <li>• <strong>Hidratación:</strong> Sorbo de agua entre sets, no te llenes.</li>
            <li>• <strong>Visualización:</strong> En últimos sets, visualiza el levantamiento perfecto.</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <section id="meetprep" className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {[
              { id: 'taper', label: '📅 Taper Planner' },
              { id: 'checklist', label: '✅ Checklist' },
              { id: 'warmup', label: '🔥 Calentamiento' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'taper' && renderTaperPlan()}
          {activeTab === 'checklist' && renderChecklist()}
          {activeTab === 'warmup' && renderWarmup()}
        </div>
      </div>
    </section>
  )
}