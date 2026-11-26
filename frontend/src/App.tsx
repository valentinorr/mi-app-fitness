import { useAuth } from './contexts/AuthContext'
import { Dashboard } from './components/Dashboard'
import { LogWorkout } from './components/LogWorkout'
import { OneRMCalculator } from './components/OneRMCalculator'
import { OneRMHistory } from './components/OneRMHistory'
import { AttemptSelector } from './components/AttemptSelector'
import { WilksCalculator } from './components/WilksCalculator'
import { MeetPrep } from './components/MeetPrep'
import { TeamSports } from './components/TeamSports'
import { LoginRegister } from './components/LoginRegister'
import { useState } from 'react'
import {
  Home,
  Dumbbell,
  BarChart,
  Trophy,
  Users,
  ChevronDown,
} from 'lucide-react'

// Definición de categorías y sus vistas
// Tipamos explícitamente views como array de objetos con id: string para evitar inferencia estrecha
interface NavView {
  id: string
  label: string
  component: React.ComponentType<any>
}

interface NavCategory {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  views: NavView[]
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'main',
    label: 'Principal',
    icon: Home,
    views: [
      { id: 'dashboard', label: 'Dashboard', component: Dashboard },
    ],
  },
  {
    id: 'training',
    label: 'Entrenamiento',
    icon: Dumbbell,
    views: [
      { id: 'log', label: 'Registrar Entreno', component: LogWorkout },
    ],
  },
  {
    id: 'strength',
    label: 'Fuerza y 1RM',
    icon: BarChart,
    views: [
      { id: 'onerm', label: 'Calculadora 1RM', component: OneRMCalculator },
      { id: 'history', label: 'Historial 1RM', component: OneRMHistory },
      { id: 'wilks', label: 'Puntos Wilks', component: WilksCalculator },
    ],
  },
  {
    id: 'competition',
    label: 'Competición',
    icon: Trophy,
    views: [
      { id: 'meetprep', label: 'Meet Prep', component: MeetPrep },
      { id: 'attempts', label: 'Selector Intentos', component: AttemptSelector },
    ],
  },
  {
    id: 'team',
    label: 'Equipo',
    icon: Users,
    views: [
      { id: 'teamsports', label: 'Monitoreo Equipo', component: TeamSports },
    ],
  },
]

type ViewId = string

function App() {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const [activeView, setActiveView] = useState<ViewId>('dashboard')
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin motion-reduce:animate-none rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginRegister />
  }

  // Encontrar el componente activo
  const activeViewConfig = NAV_CATEGORIES.flatMap(c => c.views).find(v => v.id === activeView)
  const ActiveComponent = activeViewConfig?.component || Dashboard

  const handleViewChange = (viewId: ViewId) => {
    setActiveView(viewId)
    setOpenCategory(null)
  }

  const handleCategoryClick = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Data Based Training</h1>
            </div>
            <div className="flex items-center space-x-6">
              {/* Navegación por categorías con dropdowns */}
              <div className="flex items-center space-x-2">
                {NAV_CATEGORIES.map((category) => {
                  const isActive = category.views.some(v => v.id === activeView)
                  const isOpen = openCategory === category.id

                  return (
                    <div
                      key={category.id}
                      className="relative"
                      onMouseLeave={() => !isActive && setOpenCategory(null)}
                    >
                      {category.views.length > 1 ? (
                        // Categorías con dropdown (múltiples vistas)
                        <>
                          <button
                            onClick={() => handleCategoryClick(category.id)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                            aria-expanded={isOpen}
                            aria-haspopup="true"
                          >
                            <category.icon className="w-5 h-5" aria-hidden="true" />
                            <span>{category.label}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              aria-hidden="true"
                            />
                          </button>

                          {/* Dropdown menu */}
                          {isOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                              {category.views.map((view) => (
                                <button
                                  key={view.id}
                                  onClick={() => handleViewChange(view.id)}
                                  className={`w-full text-left px-4 py-2 text-sm ${
                                    activeView === view.id
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {view.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        // Categorías de una sola vista: botón directo (sin dropdown)
                        <button
                          onClick={() => handleViewChange(category.views[0].id)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <category.icon className="w-5 h-5" aria-hidden="true" />
                          <span>{category.label}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </main>
    </div>
  )
}

export default App