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

function App() {
  const { user, loading, logout, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginRegister />
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
              <nav className="flex items-center space-x-4">
                <a href="#dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="#log" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Registrar Entreno
                </a>
                <a href="#onerm" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Calculadora 1RM
                </a>
                <a href="#history" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Historial 1RM
                </a>
                <a href="#wilks" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Puntos Wilks
                </a>
                <a href="#meetprep" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Meet Prep
                </a>
                <a href="#teamsports" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Monitoreo Equipo
                </a>
                <a href="#attempts" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Selector Intentos
                </a>
              </nav>
              <span className="text-sm text-gray-600">{user?.email}</span>
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
        <Dashboard />
        <LogWorkout />
        <OneRMCalculator />
        <OneRMHistory />
        <WilksCalculator />
        <AttemptSelector />
        <MeetPrep />
        <TeamSports />
      </main>
    </div>
  )
}

export default App