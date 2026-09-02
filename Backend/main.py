from fastapi import FastAPI, File, UploadFile, Depends
import models
from database import engine
from csv_parser import procesar_csv_ventas
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from typing import List
from fastapi.middleware.cors import CORSMiddleware


# Crea las tablas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BlindInventory POS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite que React se conecte
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"mensaje": "API de BlindInventory funcionando correctamente"}

# --- ENDPOINT PARA EL CSV ---
@app.post("/api/v1/turnos/procesar-ventas-csv")
async def cargar_ventas_csv(archivo: UploadFile = File(...)):
    """
    Recibe un archivo CSV exportado del bot de WhatsApp y procesa las ventas del turno.
    """
    # Validar que sea un archivo CSV
    if not archivo.filename.endswith('.csv'):
        return {"estado": "error", "mensaje": "El archivo debe ser un .csv"}
    
    # Leer el contenido del archivo de forma asíncrona
    contenido_bytes = await archivo.read()
    
    # Pasar los bytes a Pandas
    resultado = procesar_csv_ventas(contenido_bytes)
    
    return resultado


# --- ESQUEMAS PARA RECIBIR DATOS DEL FRONTEND ---

class TurnoCreate(BaseModel):
    nombre_cajero: str
    tipo_turno: str # Ejemplo: "Mañana", "Tarde", "Noche"

# Representa un solo producto que el cajero contó (NUEVO)
class ItemConteo(BaseModel):
    id_producto_alegra: int
    stock_inicial: int
    cantidad_digitada: int
    ventas_registradas_csv: int

# Representa todo el formulario de cierre (NUEVO)
class CierreTurno(BaseModel):
    turno_id: int
    conteos: List[ItemConteo]


# --- ENDPOINTS DE TURNOS ---

@app.post("/api/v1/turnos/abrir")
def abrir_turno(turno: TurnoCreate, db: Session = Depends(get_db)):
    """
    Inicia un nuevo turno en la base de datos.
    """
    nuevo_turno = models.Turno(
        nombre_cajero=turno.nombre_cajero,
        tipo_turno=turno.tipo_turno,
        estado_abierto=True,
        hora_inicio=datetime.utcnow()
    )
    
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)
    
    return {
        "estado": "exito",
        "mensaje": f"Turno de la {turno.tipo_turno} abierto correctamente por {turno.nombre_cajero}.",
        "turno_id": nuevo_turno.id,
        "hora_inicio": nuevo_turno.hora_inicio
    }

# ---  ENDPOINT DE CIERRE Y CONCILIACIÓN ---
@app.post("/api/v1/turnos/cerrar")
def cerrar_turno(datos_cierre: CierreTurno, db: Session = Depends(get_db)):
    """
    Cierra el turno, calcula las diferencias a ciegas y genera el reporte.
    """
    # 1. Buscar el turno en la base de datos
    turno_actual = db.query(models.Turno).filter(models.Turno.id == datos_cierre.turno_id).first()
    
    if not turno_actual:
        return {"estado": "error", "mensaje": "Turno no encontrado."}
    
    if not turno_actual.estado_abierto:
        return {"estado": "error", "mensaje": "Este turno ya fue cerrado previamente."}

    # 2. Procesar la matemática del inventario
    reporte_descuadres = []
    
    for item in datos_cierre.conteos:
        # FÓRMULA DEL INVENTARIO A CIEGAS
        stock_teorico_esperado = item.stock_inicial - item.ventas_registradas_csv
        diferencia = item.cantidad_digitada - stock_teorico_esperado
        
        # Guardar en SQLite
        nuevo_conteo = models.ConteoFisico(
            turno_id=turno_actual.id,
            id_producto_alegra=item.id_producto_alegra,
            cantidad_digitada=item.cantidad_digitada,
            ventas_registradas_csv=item.ventas_registradas_csv,
            diferencia=diferencia
        )
        db.add(nuevo_conteo)
        
        # Registrar si hubo descuadre
        if diferencia != 0:
            reporte_descuadres.append({
                "id_producto": item.id_producto_alegra,
                "esperado": stock_teorico_esperado,
                "contado": item.cantidad_digitada,
                "diferencia": diferencia,
                "estado": "FALTANTE" if diferencia < 0 else "SOBRANTE"
            })

    # 3. Cerrar el turno oficialmente
    turno_actual.estado_abierto = False
    turno_actual.hora_fin = datetime.utcnow()
    
    db.commit()
    
    # 4. Generar el Veredicto
    if len(reporte_descuadres) == 0:
        veredicto = "¡PAZ Y SALVO! Turno entregado perfectamente cuadrado."
    else:
        veredicto = "ATENCIÓN: Se encontraron diferencias en el inventario."

    return {
        "estado": "exito",
        "mensaje": veredicto,
        "detalles": reporte_descuadres
    }