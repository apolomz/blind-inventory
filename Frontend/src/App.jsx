import { useState } from 'react'

function App() {
  const [nombre, setNombre] = useState('')
  const [turno, setTurno] = useState('Mañana')
  const [mensaje, setMensaje] = useState(null)
  const [turnoActivo, setTurnoActivo] = useState(false)

  const handleAbrirTurno = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/turnos/abrir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_cajero: nombre,
          tipo_turno: turno
        })
      })

      const data = await response.json()
      
      if (data.estado === 'exito') {
        setMensaje(data.mensaje)
        setTurnoActivo(true)
      }
    } catch (error) {
      setMensaje("Error al conectar con el servidor.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Blind-Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Control de Turnos - Terminal</p>
        </div>

        {!turnoActivo ? (
          <form onSubmit={handleAbrirTurno} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cajero</label>
              <input 
                type="text" 
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Introduce nombre de cajero en turno"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Turno a Cubrir</label>
              <select 
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="Mañana">Turno Mañana</option>
                <option value="Tarde">Turno Tarde</option>
                <option value="Noche">Turno Noche / Madrugada</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
            >
              Iniciar Turno y Congelar Stock
            </button>
            
            {mensaje && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                {mensaje}
              </div>
            )}
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Turno Iniciado</h2>
              <p className="text-slate-600 mt-2 text-sm">{mensaje}</p>
            </div>
            <button 
              onClick={() => {
                // Aquí luego conectaremos la pantalla de cierre
                alert("Módulo de entrega en construcción")
              }}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Ir a Entregar Turno
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App