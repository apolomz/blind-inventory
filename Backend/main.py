from fastapi import FastAPI, File, UploadFile, Depends
import models
from database import engine
from csv_parser import procesar_csv_ventas
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db

# Crea las tablas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BlindInventory POS API")

@app.get("/")
def read_root():
    return {"mensaje": "API de BlindInventory funcionando correctamente"}

# --- NUEVO ENDPOINT PARA EL CSV ---
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


# Esquema para recibir los datos desde el frontend
class TurnoCreate(BaseModel):
    nombre_cajero: str
    tipo_turno: str # Ejemplo: "Mañana", "Tarde", "Noche"


@app.post("/api/v1/turnos/abrir")
def abrir_turno(turno: TurnoCreate, db: Session = Depends(get_db)):
    """
    Inicia un nuevo turno en la base de datos.
    Más adelante, aquí conectaremos la consulta a Alegra para el Snapshot.
    """
    # Creamos el registro en la base de datos
    nuevo_turno = models.Turno(
        nombre_cajero=turno.nombre_cajero,
        tipo_turno=turno.tipo_turno,
        estado_abierto=True,
        hora_inicio=datetime.utcnow()
    )
    
    # Guardamos y aplicamos los cambios
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno) # Refrescamos para obtener el ID que generó SQLite
    
    return {
        "estado": "exito",
        "mensaje": f"Turno de la {turno.tipo_turno} abierto correctamente por {turno.nombre_cajero}.",
        "turno_id": nuevo_turno.id,
        "hora_inicio": nuevo_turno.hora_inicio
    }