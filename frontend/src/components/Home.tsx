import { Link } from 'react-router-dom'
import {
  BarChart,
  Trophy,
  Users,
  ClipboardList,
  Target,
  Timer,
  Smartphone,
  Shield,
  ArrowRight,
  Check,
} from 'lucide-react'

export function Home() {
  // Features for coaches
  const coachFeatures = [
    {
      icon: ClipboardList,
      title: 'Planificación de Ciclos',
      desc: 'Crea mesociclos, microciclos y sesiones con progresión automática de cargas (RPE, %1RM, RIR).',
    },
    {
      icon: Users,
      title: 'Gestión de Equipo',
      desc: 'Dashboard grupal con readiness score, volumen semanal y alertas de fatiga por atleta.',
    },
    {
      icon: BarChart,
      title: 'Analítica Avanzada',
      desc: 'Tendencias de fuerza, ACWR, carga aguda/crónica y predicción de 1RM por ejercicio.',
    },
    {
      icon: Trophy,
      title: 'Meet Prep Completo',
      desc: 'Selector de intentos IPF, cálculos de Wilks/IPF Points y planificación de calentamientos.',
    },
  ]

  // Features for athletes
  const athleteFeatures = [
    {
      icon: Target,
      title: 'Registro Inteligente',
      desc: 'Log de series con RPE/RIR, cálculo automático de 1RM (Epley + RTS) y volumen por sesión.',
    },
    {
      icon: Timer,
      title: 'Progreso en Tiempo Real',
      desc: 'Gráficos de volumen semanal, historial de 1RM estimado y readiness score diario.',
    },
    {
      icon: Smartphone,
      title: 'PWA Offline-First',
      desc: 'Registra entrenos sin conexión, sincroniza al volver online. Instalable como app nativa.',
    },
    {
      icon: Shield,
      title: 'Privacidad Total',
      desc: 'Tus datos son tuyos. Sin publicidad, sin venta a terceros, exportación completa en cualquier momento.',
    },
  ]

  // Core platform features
  const platformFeatures = [
    {
      icon: Check,
      text: 'Cálculo de 1RM con Epley + ajuste RPE (tabla RTS)',
    },
    {
      icon: Check,
      text: 'Puntos Wilks / IPF GL / DOTS automáticos',
    },
    {
      icon: Check,
      text: 'Selector de intentos para competencia (IPF rules)',
    },
    {
      icon: Check,
      text: 'ACWR (Acute:Chronic Workload Ratio) semanal',
    },
    {
      icon: Check,
      text: 'Readiness score basado en HRV/sueño (opcional)',
    },
    {
      icon: Check,
      text: 'Exportación CSV/JSON de todo tu historial',
    },
    {
      icon: Check,
      text: 'Multi-idioma: Español / English',
    },
    {
      icon: Check,
      text: 'Modo oscuro nativo (respeta prefers-color-scheme)',
    },
  ]

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-paper-2 to-paper" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <p className="font-display text-display-s text-accent mb-6 tracking-display">
                Data Based Training
              </p>
              <h1 className="font-display text-display-l lg:text-6xl leading-[1.02] text-ink mb-6 tracking-display">
                Entrena con datos.
                <br />
                <span className="text-accent">No con suposiciones.</span>
              </h1>
              <p className="font-body text-lg text-ink-muted max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Plataforma de fuerza para coaches y atletas: programa, trackea y compite con evidencia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="btn btn--primary group inline-flex items-center justify-center gap-2 px-8 py-4 text-base"
                >
                  Crear cuenta gratis
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="btn btn--secondary inline-flex items-center justify-center px-8 py-4 text-base"
                >
                  Iniciar sesión
                </Link>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start text-sm text-ink-muted">
                <span>Sin tarjeta de crédito</span>
                <span>14 días gratis</span>
                <span>Cancela cuando quieras</span>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="bg-paper-3 border border-rule rounded-card p-8 shadow-none">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="p-4">
                    <div className="font-display text-3xl font-display text-ink">12K+</div>
                    <div className="font-body text-sm text-ink-muted">Entrenos registrados</div>
                  </div>
                  <div className="p-4">
                    <div className="font-display text-3xl font-display text-ink">850+</div>
                    <div className="font-body text-sm text-ink-muted">Atletas activos</div>
                  </div>
                  <div className="p-4">
                    <div className="font-display text-3xl font-display text-ink">99.9%</div>
                    <div className="font-body text-sm text-ink-muted">Uptime garantizado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Para Coaches Section */}
      <section className="py-20 lg:py-28 bg-paper border-t border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="font-display text-display-s text-accent mb-4 tracking-display">Para Coaches</p>
            <h2 className="font-display text-display-m text-ink mb-4 tracking-display">
              Programa ciclos, monitoriza atletas y gana competiciones.
            </h2>
            <p className="font-body text-lg text-ink-muted max-w-2xl mx-auto">
              Herramientas profesionales para gestionar atletas, planificar ciclos y tomar decisiones
              basadas en datos, no en intuición.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coachFeatures.map((feature) => (
              <article
                key={feature.title}
                className="bg-paper-2 border border-rule rounded-card p-6 hover:border-rule-2 transition-colors group"
              >
                <div className="w-12 h-12 bg-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <feature.icon className="w-6 h-6 text-accent-ink" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-display text-ink mb-2 tracking-display">
                  {feature.title}
                </h3>
                <p className="font-body text-ink-muted leading-relaxed">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Para Atletas Section */}
      <section className="py-20 lg:py-28 bg-paper-2 border-t border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="font-display text-display-s text-accent mb-4 tracking-display">Para Atletas</p>
            <h2 className="font-display text-display-m text-ink mb-4 tracking-display">
              Registra series, analiza progreso y supera tus marcas.
            </h2>
            <p className="font-body text-lg text-ink-muted max-w-2xl mx-auto">
              Tu diario de fuerza inteligente. Registra series en segundos, visualiza tu progreso
              y llega a la competición sabiendo exactamente dónde estás.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {athleteFeatures.map((feature) => (
              <article
                key={feature.title}
                className="bg-paper border border-rule rounded-card p-6 hover:border-accent transition-colors group"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-ink" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-display text-ink mb-2 tracking-display">
                  {feature.title}
                </h3>
                <p className="font-body text-ink-muted leading-relaxed">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28 bg-paper border-t border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="font-display text-display-s text-accent mb-4 tracking-display">Funcionalidades</p>
            <h2 className="font-display text-display-m text-ink mb-4 tracking-display">
              Todo lo que necesitas. Nada que no.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformFeatures.map((feature) => (
              <div
                key={feature.text}
                className="flex items-start gap-3 p-4 bg-paper-2 border border-rule rounded-card hover:border-rule-2 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-accent flex items-center justify-center mt-0.5">
                  <feature.icon className="w-4 h-4 text-accent-ink" aria-hidden="true" />
                </div>
                <p className="font-body text-ink text-sm leading-relaxed">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-ink border-t border-rule-2">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-display text-display-s text-accent mb-4 tracking-display">¿Listo para entrenar con datos?</p>
          <h2 className="font-display text-display-m text-paper mb-6 tracking-display">
            Únete a cientos de coaches y atletas que ya entrenan con evidencia.
          </h2>
          <p className="font-body text-lg text-ink-muted mb-10 max-w-xl mx-auto">
            Crea tu cuenta en 30 segundos. Acceso completo por 14 días. Sin compromiso.
          </p>
          <Link
            to="/register"
            className="btn btn--primary inline-flex items-center justify-center gap-2 px-10 py-5 text-lg"
          >
            Crear mi cuenta gratis
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <p className="mt-6 text-sm text-ink-muted">
            Al registrarte, aceptas nuestros
            <a href="/terminos" className="underline hover:text-accent">Términos de servicio</a>
            y
            <a href="/privacidad" className="underline hover:text-accent">Política de privacidad</a>.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-rule py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="font-display text-lg font-display text-paper mb-4 tracking-display">
                Data Based Training
              </h3>
              <p className="font-body text-ink-muted text-sm leading-relaxed max-w-xs">
                La plataforma de fuerza basada en evidencia para coaches y atletas que exigen precisión.
              </p>
            </div>
            <div>
              <h4 className="font-body text-sm font-medium text-paper mb-3">
                Producto
              </h4>
              <ul className="space-y-2 font-body text-sm text-ink-muted">
                <li><a href="/features" className="underline hover:text-accent transition-colors">Funcionalidades</a></li>
                <li><a href="/precios" className="underline hover:text-accent transition-colors">Precios</a></li>
                <li><a href="/docs" className="underline hover:text-accent transition-colors">Documentación</a></li>
                <li><a href="/api" className="underline hover:text-accent transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-body text-sm font-medium text-paper mb-3">
                Empresa
              </h4>
              <ul className="space-y-2 font-body text-sm text-ink-muted">
                <li><a href="/nosotros" className="underline hover:text-accent transition-colors">Nosotros</a></li>
                <li><a href="/blog" className="underline hover:text-accent transition-colors">Blog</a></li>
                <li><a href="/empleos" className="underline hover:text-accent transition-colors">Empleos</a></li>
                <li><a href="/contacto" className="underline hover:text-accent transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-rule pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-sm text-ink-muted">
              © 2025 Data Based Training. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="/privacidad" className="font-body text-sm text-ink-muted hover:text-accent transition-colors">
                Privacidad
              </a>
              <a href="/terminos" className="font-body text-sm text-ink-muted hover:text-accent transition-colors">
                Términos
              </a>
              <a href="/cookies" className="font-body text-sm text-ink-muted hover:text-accent transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}