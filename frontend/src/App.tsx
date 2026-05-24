import { useState } from 'react'
import { Home } from 'lucide-react'
import Navbar from './components/Navbar'

type TabType = 'seguimiento' | 'operador' | 'analista'

type Activo = {
  id: number
  descripcion: string
  valor: number
  estado_actual: 'SOLICITADO' | 'EN_TRANSITO' | 'EN_ACOPIO' | 'ENTREGADO' | 'EN_DISPUTA'
  rut_custodio: string
  comentario_incidencia: string
}

function App() {
  const [simulacionIniciada, setSimulacionIniciada] = useState(false)
  const [rutResponsable, setRutResponsable] = useState('')
  const [descripcionPaquete, setDescripcionPaquete] = useState('')
  
  const [activeTab, setActiveTab] = useState<TabType>('seguimiento')

  const [activo, setActivo] = useState<Activo>({
    id: 1,
    descripcion: 'Equipamiento Tecnológico',
    valor: 150000,
    estado_actual: 'SOLICITADO',
    rut_custodio: '',
    comentario_incidencia: '',
  })

  const [rutInput, setRutInput] = useState('')

  const handleIniciarSimulacion = () => {
    if (!rutResponsable || !descripcionPaquete) {
      alert('Por favor completa los campos requeridos')
      return
    }
    setActivo((prev) => ({
      ...prev,
      descripcion: descripcionPaquete,
      rut_custodio: rutResponsable,
    }))
    setRutInput(rutResponsable)
    setSimulacionIniciada(true)
  }

  const updateActivo = (patch: Partial<Activo>) => {
    setActivo((prev) => ({ ...prev, ...patch }))
  }

  const [hoveredStep, setHoveredStep] = useState<string | null>(null)

  const renderSeguimiento = () => {
    const steps: Activo['estado_actual'][] = [
      'SOLICITADO',
      'EN_TRANSITO',
      'EN_ACOPIO',
      'ENTREGADO',
    ]

    const currentIndex = steps.indexOf(activo.estado_actual as any)
    const selloEstado = activo.estado_actual === 'EN_DISPUTA' ? 'Roto' : 'Conforme'

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Seguimiento Público</h1>
            <p className="text-gray-300">Estado del activo #{activo.id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">{activo.descripcion}</p>
            <p className="text-sm text-gray-400">Valor: ${activo.valor.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {steps.map((s, i) => {
              const completed = i <= currentIndex
              const isCurrent = i === currentIndex
              return (
                <div key={s} className="flex items-center">
                  {/* Tarjeta rectangular con tooltip */}
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredStep(s)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div
                      className={`px-6 py-3 rounded-xl min-w-[150px] text-center font-medium transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/50 scale-105'
                          : completed
                          ? 'bg-emerald-700/60 text-white border border-emerald-500/50'
                          : 'bg-white/5 text-gray-300 border border-white/10'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </div>

                    {/* Tooltip flotante */}
                    {hoveredStep === s && (
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-white/20 p-3 rounded-lg text-xs w-48 shadow-xl z-50 pointer-events-none">
                        <p className="text-gray-200"><strong>Estado:</strong> {s.replace('_', ' ')}</p>
                        <p className="text-gray-300 mt-1"><strong>Custodio:</strong> {rutResponsable || 'N/A'}</p>
                        <p className="text-gray-300"><strong>Sello:</strong> <span className={selloEstado === 'Conforme' ? 'text-emerald-400' : 'text-red-400'}>{selloEstado}</span></p>
                      </div>
                    )}
                  </div>

                  {/* Conector entre pasos */}
                  {i < steps.length - 1 && (
                    <div
                      className={`w-8 h-1 mx-2 rounded-full transition-all ${
                        i < currentIndex ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              )
            })}

            {/* Ícono de Casa Final */}
            <div className="ml-4 flex items-center">
              <div className={`w-1 h-1 mx-2 rounded-full ${currentIndex >= steps.length - 1 ? 'bg-emerald-400' : 'bg-white/10'}`} />
              <div
                className={`p-3 rounded-xl transition-all ${
                  activo.estado_actual === 'ENTREGADO'
                    ? 'bg-emerald-400/30 shadow-lg shadow-emerald-500/60 scale-110'
                    : 'bg-white/5'
                }`}
              >
                <Home
                  size={36}
                  className={`transition-all ${
                    activo.estado_actual === 'ENTREGADO'
                      ? 'text-emerald-300 drop-shadow-lg'
                      : 'text-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {activo.estado_actual === 'EN_DISPUTA' && (
            <div className="mt-6 p-4 rounded-lg bg-red-900/60 border border-red-500 text-red-100">
              <strong>🚨 Alerta:</strong> Existe una disputa logística sobre este activo.
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderOperador = () => {
    const handleStartTransit = () => {
      if (!rutInput) return alert('Ingrese RUT del custodio antes de iniciar tránsito')
      updateActivo({ estado_actual: 'EN_TRANSITO', rut_custodio: rutInput })
    }

    const handleReceiveAcopio = () => {
      updateActivo({ estado_actual: 'EN_ACOPIO' })
    }

    const handleConfirmEntrega = () => {
      updateActivo({ estado_actual: 'ENTREGADO' })
    }

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Portal Operador</h1>
        <p className="text-gray-300">Gestiona el movimiento del activo</p>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-2">RUT Custodio</label>
              <input
                value={rutInput}
                onChange={(e) => setRutInput(e.target.value)}
                placeholder="12.345.678-9"
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-white/10 transition"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-2">Estado actual</label>
              <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">{activo.estado_actual}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStartTransit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
            >
              Iniciar Tránsito
            </button>
            <button
              onClick={handleReceiveAcopio}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white transition-colors"
            >
              Recibir en Acopio
            </button>
            <button
              onClick={handleConfirmEntrega}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
            >
              Confirmar Entrega
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAnalista = () => {
    const handleSimularAnomalia = () => {
      updateActivo({ estado_actual: 'EN_DISPUTA', comentario_incidencia: 'Sello dañado - simulación' })
    }

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Panel de Analista</h1>
        <p className="text-gray-300">Herramientas para análisis y contingencia</p>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300">Activo: <span className="font-semibold text-white">{activo.descripcion}</span></p>
              <p className="text-gray-400 text-sm">Estado: {activo.estado_actual}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSimularAnomalia}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white"
              >
                Simular Anomalía de Sello
              </button>
            </div>
          </div>

          {activo.estado_actual === 'EN_DISPUTA' && (
            <div className="mt-4 rounded-lg p-4 bg-red-900/60 border border-red-500 text-red-100">
              <strong>Disputa abierta:</strong> {activo.comentario_incidencia}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'seguimiento':
        return renderSeguimiento()
      case 'operador':
        return renderOperador()
      case 'analista':
        return renderAnalista()
    }
  }

  const renderBienvenida = () => {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        {/* Gradientes de fondo decorativos */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-600/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-purple-600/20 to-transparent rounded-full blur-3xl"></div>
        </div>

        {/* Contenido formulario */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                📦 Track & Trace
              </h1>
              <p className="text-gray-400">Sistema de Seguimiento Premium</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleIniciarSimulacion()
              }}
              className="space-y-5"
            >
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-2 font-medium">RUT del Responsable</label>
                <input
                  type="text"
                  value={rutResponsable}
                  onChange={(e) => setRutResponsable(e.target.value)}
                  placeholder="12.345.678-9"
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-2 font-medium">Descripción del Paquete</label>
                <input
                  type="text"
                  value={descripcionPaquete}
                  onChange={(e) => setDescripcionPaquete(e.target.value)}
                  placeholder="Ej. Equipamiento Tecnológico, Documentos..."
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-semibold text-white transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 mt-6"
              >
                Iniciar Simulación
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-400 text-center">
                ✨ Prototipo Mínimo Navegable v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {!simulacionIniciada ? (
        renderBienvenida()
      ) : (
        <div className="min-h-screen bg-slate-950 text-white">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-600/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-purple-600/10 to-transparent rounded-full blur-3xl"></div>
          </div>

          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="relative z-10 pt-24 px-6 md:pl-80 pb-12">
            {renderTabContent()}
          </main>
        </div>
      )}
    </>
  )
}

export default App
