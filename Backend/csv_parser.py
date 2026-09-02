# backend/csv_parser.py
import pandas as pd
from io import BytesIO

def procesar_csv_ventas(file_bytes: bytes):
    """
    Lee el archivo CSV en memoria usando Pandas y lo convierte a un formato 
    fácil de cruzar con la base de datos.
    """
    try:

        df = pd.read_csv(BytesIO(file_bytes))
        df.columns = df.columns.str.strip()
        
        # Aquí asumiremos que el CSV del chatbot tiene columnas como 'Producto' y 'Cantidad'
        # Puedes ajustar estos nombres después cuando veas la estructura exacta del Excel
        

        datos_ventas = df.to_dict(orient='records')
        
        return {
            "estado": "exito", 
            "total_registros": len(datos_ventas),
            "ventas": datos_ventas
        }
        
    except pd.errors.EmptyDataError:
        return {"estado": "error", "mensaje": "El archivo CSV está vacío."}
    except Exception as e:
        return {"estado": "error", "mensaje": f"Error procesando el archivo: {str(e)}"}