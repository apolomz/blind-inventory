from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    nombre_cajero = Column(String, index=True)
    tipo_turno = Column(String) # Mañana, Tarde, Noche
    hora_inicio = Column(DateTime, default=datetime.utcnow)
    hora_fin = Column(DateTime, nullable=True)
    estado_abierto = Column(Boolean, default=True)
    
    # Relaciones
    snapshots = relationship("SnapshotInventario", back_populates="turno")
    conteos = relationship("ConteoFisico", back_populates="turno")

class SnapshotInventario(Base):
    """Guarda el stock exacto que había al iniciar el turno"""
    __tablename__ = "snapshots_inventario"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"))
    id_producto_alegra = Column(Integer, index=True)
    nombre_producto = Column(String)
    categoria = Column(String)
    stock_inicial = Column(Integer)
    precio_unitario = Column(Float)

    turno = relationship("Turno", back_populates="snapshots")

class ConteoFisico(Base):
    """Guarda lo que el cajero digitó a ciegas al final del turno"""
    __tablename__ = "conteos_fisicos"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"))
    id_producto_alegra = Column(Integer)
    cantidad_digitada = Column(Integer)
    ventas_registradas_csv = Column(Integer, default=0) # Lo que sacamos del CSV
    diferencia = Column(Integer, default=0) # Faltante o Sobrante

    turno = relationship("Turno", back_populates="conteos")