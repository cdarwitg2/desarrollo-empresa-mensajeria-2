import { useState } from 'react'
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

  const updateActivo = (patch: Partial<Activo>) => {
    setActivo((prev) => ({ ...prev, ...patch }))
  }

  const renderSeguimiento = () => {
    const steps: Activo['estado_actual'][] = [
      'SOLICITADO',
      'EN_TRANSITO',
      'EN_ACOPIO',
      'ENTREGADO',
    ]

    const currentIndex = steps.indexOf(activo.estado_actual as any)

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

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-4">
            {steps.map((s, i) => {
              const completed = i <= currentIndex
              const isCurrent = i === currentIndex
              return (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-emerald-400 text-slate-900 shadow-lg scale-105'
                        : completed
                        ? 'bg-emerald-700/60 text-white'
                        : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </div>

                  {i < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-3 rounded-full ${
                        i < currentIndex ? 'bg-emerald-400' : 'bg-white/5'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {activo.estado_actual === 'EN_DISPUTA' && (
            <div className="mt-6 p-4 rounded-lg bg-red-900/60 border border-red-500 text-red-100">
              <strong>Alerta:</strong> Existe una disputa logística sobre este activo.
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
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
            >
              Iniciar Tránsito
            </button>
            <button
              onClick={handleReceiveAcopio}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white"
            >
              Recibir en Acopio
            </button>
            <button
              onClick={handleConfirmEntrega}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white"
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

  return (
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
  )
}

export default App
