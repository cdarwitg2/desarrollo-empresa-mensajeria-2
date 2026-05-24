import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-indigo-900 mb-2">
            📦 Track & Trace
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sistema de Seguimiento de Mensajería
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <p className="text-gray-700 text-center">
              Aplicación en construcción...
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
