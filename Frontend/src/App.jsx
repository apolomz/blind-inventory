import { useState } from 'react'

function App() {
  // Estados para la navegación y el turno
  const [vista, setVista] = useState('inicio') // 'inicio', 'conteo', 'resultado'
  const [turnoId, setTurnoId] = useState(null)
  const [nombre, setNombre] = useState('')
  const [turno, setTurno] = useState('Mañana')
  const [mensaje, setMensaje] = useState(null)
  
  // Estado para el reporte final
  const [reporteFinal, setReporteFinal] = useState(null)

  // Estado para el inventario (Categorizado y con precios para calcular la plata)
  const [inventario, setInventario] = useState([
    { id_producto_alegra: 101, categoria: "Papas y Snacks", nombre: "De Todito Grande", stock_inicial: 27, ventas_registradas_csv: 2, precio_unitario: 15000, cantidad_digitada: '' },
    { id_producto_alegra: 102, categoria: "Papas y Snacks", nombre: "Margarita Limón", stock_inicial: 15, ventas_registradas_csv: 1, precio_unitario: 5000, cantidad_digitada: '' },
    { id_producto_alegra: 201, categoria: "Bebidas", nombre: "Coca-Cola 600ml", stock_inicial: 15, ventas_registradas_csv: 5, precio_unitario: 4000, cantidad_digitada: '' },
    { id_producto_alegra: 202, categoria: "Bebidas", nombre: "Jugo Hit Mora", stock_inicial: 10, ventas_registradas_csv: 2, precio_unitario: 3500, cantidad_digitada: '' },
    { id_producto_alegra: 301, categoria: "Fritos", nombre: "Empanada de Carne", stock_inicial: 40, ventas_registradas_csv: 12, precio_unitario: 3000, cantidad_digitada: '' },
    { id_producto_alegra: 401, categoria: "Panadería", nombre: "Pan de Bono", stock_inicial: 20, ventas_registradas_csv: 8, precio_unitario: 2500, cantidad_digitada: '' },
    { id_producto_alegra: 501, categoria: "Dulces", nombre: "Chocoramo", stock_inicial: 30, ventas_registradas_csv: 4, precio_unitario: 2500, cantidad_digitada: '' }
  ])

  // Extraemos las categorías únicas para renderizar los bloques
  const categorias = [...new Set(inventario.map(item => item.categoria))]

  // --- FUNCIÓN: ABRIR TURNO ---
  const handleAbrirTurno = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/v1/turnos/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_cajero: nombre, tipo_turno: turno })
      })
      const data = await response.json()
      
      if (data.estado === 'exito') {
        setTurnoId(data.turno_id)
        setMensaje(data.mensaje)
        setVista('conteo')
      }
    } catch (error) {
      setMensaje("Error al conectar con el servidor.")
    }
  }

  // --- FUNCIÓN: MANEJAR INPUT DE CONTEO (Ajustado para buscar por ID) ---
  const handleCambioConteo = (id, valor) => {
    const nuevoInventario = inventario.map(item => {
      if (item.id_producto_alegra === id) {
        return { ...item, cantidad_digitada: valor === '' ? '' : parseInt(valor) }
      }
      return item
    })
    setInventario(nuevoInventario)
  }

  // --- FUNCIÓN: CERRAR TURNO ---
  const handleCerrarTurno = async (e) => {
    e.preventDefault()
    
    // 1. Filtramos para enviar SOLO los productos que el cajero realmente digitó
    const productosContados = inventario.filter(item => item.cantidad_digitada !== '')

    if (productosContados.length === 0) {
      alert("Debes ingresar el conteo de al menos un producto para entregar.")
      return
    }

    const payload = {
      turno_id: turnoId,
      conteos: productosContados.map(item => ({
        id_producto_alegra: item.id_producto_alegra,
        stock_inicial: item.stock_inicial,
        cantidad_digitada: item.cantidad_digitada, // Ya no forzamos el 0
        ventas_registradas_csv: item.ventas_registradas_csv
      }))
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/turnos/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      
      if (data.estado === 'exito') {
        // 2. Enriquecemos el reporte con los nombres y el valor en dinero COP
        const detallesConDinero = data.detalles.map(detalle => {
          const productoLocal = inventario.find(p => p.id_producto_alegra === detalle.id_producto)
          const valorDinero = Math.abs(detalle.diferencia) * (productoLocal ? productoLocal.precio_unitario : 0)
          return { 
            ...detalle, 
            nombre: productoLocal?.nombre, 
            valor_dinero: valorDinero 
          }
        })
        
        setReporteFinal({ ...data, detalles: detallesConDinero })
        setVista('resultado')
      }
    } catch (error) {
      alert("Error al enviar el conteo")
    }
  }

  // Formateador de moneda colombiana
  const formatoCOP = (valor) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor)

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">BlindInventory POS</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Terminal de Transportes</p>
        </div>

        {/* VISTA 1: ABRIR TURNO */}
        {vista === 'inicio' && (
          <form onSubmit={handleAbrirTurno} className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Cajero</label>
              <input 
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                placeholder="Ej. Jhoan Fernandez"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Turno a Cubrir</label>
              <select 
                value={turno} onChange={(e) => setTurno(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white shadow-sm"
              >
                <option value="Mañana">Turno Mañana</option>
                <option value="Tarde">Turno Tarde</option>
                <option value="Noche">Turno Noche / Madrugada</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md text-lg">
              Iniciar Turno
            </button>
            {mensaje && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center font-medium">{mensaje}</div>}
          </form>
        )}

        {/* VISTA 2: CONTEO FÍSICO A CIEGAS POR CATEGORÍAS */}
        {vista === 'conteo' && (
          <form onSubmit={handleCerrarTurno} className="space-y-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h2 className="text-blue-800 font-bold text-lg">Turno Activo: {turno}</h2>
              <p className="text-blue-600 text-sm">Cajero: {nombre} | ID Turno: {turnoId}</p>
            </div>
            
            <p className="text-slate-600 font-medium bg-yellow-50 border-l-4 border-yellow-400 p-3">
              Solo ingresa los productos que necesites contar en este turno. Si dejas la casilla en blanco, el sistema no la auditará.
            </p>
            
            {categorias.map(categoria => (
              <div key={categoria} className="space-y-3">
                <h3 className="font-bold text-lg text-slate-800 border-b pb-2">{categoria}</h3>
                
                {inventario.filter(item => item.categoria === categoria).map((item) => (
                  <div key={item.id_producto_alegra} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-semibold text-slate-700 text-base">{item.nombre}</div>
                      <div className="text-xs text-slate-400">Cod: {item.id_producto_alegra}</div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="Vacío"
                      value={item.cantidad_digitada}
                      onChange={(e) => handleCambioConteo(item.id_producto_alegra, e.target.value)}
                      className="w-24 px-3 py-2 text-center text-lg font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-sm placeholder:font-normal"
                    />
                  </div>
                ))}
              </div>
            ))}

            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-md text-lg mt-6">
              Procesar y Entregar Turno
            </button>
          </form>
        )}

        {/* VISTA 3: RESULTADO DE LA CONCILIACIÓN */}
        {vista === 'resultado' && reporteFinal && (
          <div className="text-center space-y-6">
            
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm ${reporteFinal.detalles.length === 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {reporteFinal.detalles.length === 0 ? '✓' : '⚠'}
            </div>
            
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">{reporteFinal.mensaje}</h2>
              {reporteFinal.detalles.length > 0 && (
                <p className="text-slate-500 mt-2">Los siguientes productos presentaron inconsistencias:</p>
              )}
            </div>

            {reporteFinal.detalles.length > 0 && (
              <div className="mt-6 text-left border rounded-lg overflow-x-auto shadow-sm">
                <table className="w-full min-w-max">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold">Producto</th>
                      <th className="px-4 py-3 text-sm font-semibold text-center">Esperado</th>
                      <th className="px-4 py-3 text-sm font-semibold text-center">Contado</th>
                      <th className="px-4 py-3 text-sm font-semibold text-center">Diferencia</th>
                      <th className="px-4 py-3 text-sm font-semibold text-right">Valor (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {reporteFinal.detalles.map((detalle, idx) => (
                      <tr key={idx} className={detalle.estado === 'FALTANTE' ? 'bg-red-50' : 'bg-yellow-50'}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-slate-800">{detalle.nombre}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-slate-600">{detalle.esperado}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-slate-800">{detalle.contado}</td>
                        <td className={`px-4 py-3 text-sm font-bold text-center ${detalle.estado === 'FALTANTE' ? 'text-red-600' : 'text-yellow-600'}`}>
                          {detalle.diferencia} ({detalle.estado})
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold text-right ${detalle.estado === 'FALTANTE' ? 'text-red-700' : 'text-yellow-700'}`}>
                          {formatoCOP(detalle.valor_dinero)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="mt-8 w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Finalizar y Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App