from fastapi import FastAPI
import models
from database import engine

# Esto crea las tablas en la base de datos si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BlindInventory POS API")

@app.get("/")
def read_root():
    return {"mensaje": "API de BlindInventory funcionando correctamente"}