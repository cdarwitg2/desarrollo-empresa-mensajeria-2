"""
Modelos de base de datos
Define las entidades principales del sistema
"""
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import json
from datetime import datetime

class Usuario(db.Model):
    """
    Modelo de Usuario con soporte para múltiples roles
    
    Attributes:
        rut (str): RUT del usuario, clave primaria
        nombre_completo (str): Nombre completo del usuario
        password_hash (str): Hash encriptado de la contraseña
        roles (str): Roles del usuario en formato JSON
        activo (bool): Estado del usuario
        created_at (datetime): Fecha de creación
        updated_at (datetime): Fecha de última actualización
    """
    
    __tablename__ = 'usuarios'
    
    rut = db.Column(db.String(12), primary_key=True, nullable=False, unique=True)
    nombre_completo = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    roles = db.Column(db.JSON, nullable=False, default=['usuario'])  # Almacenar como JSON
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Usuario {self.rut} - {self.nombre_completo}>'
    
    def set_password(self, password):
        """
        Encripta y guarda la contraseña
        
        Args:
            password (str): Contraseña en texto plano
        """
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """
        Verifica una contraseña contra el hash almacenado
        
        Args:
            password (str): Contraseña en texto plano a verificar
        
        Returns:
            bool: True si la contraseña es correcta, False en caso contrario
        """
        return check_password_hash(self.password_hash, password)
    
    def set_roles(self, roles):
        """
        Establece los roles del usuario
        
        Args:
            roles (list or str): Lista de roles o string separado por comas
        """
        if isinstance(roles, str):
            self.roles = [r.strip() for r in roles.split(',')]
        else:
            self.roles = roles if isinstance(roles, list) else ['usuario']
    
    def get_roles_list(self):
        """
        Obtiene la lista de roles del usuario
        
        Returns:
            list: Lista de roles
        """
        if isinstance(self.roles, list):
            return self.roles
        elif isinstance(self.roles, str):
            return [r.strip() for r in self.roles.split(',')]
        return ['usuario']
    
    def to_dict(self):
        """
        Convierte el usuario a diccionario
        
        Returns:
            dict: Representación del usuario
        """
        return {
            'rut': self.rut,
            'nombre_completo': self.nombre_completo,
            'roles': self.get_roles_list(),
            'activo': self.activo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Asset(db.Model):
    """
    Modelo de Paquete/Asset para trazabilidad de envíos
    
    Attributes:
        id (int): Identificador único del paquete
        nombre (str): Nombre del paquete
        descripcion (str): Descripción detallada del contenido
        direccion_origen (str): Dirección de origen del envío
        direccion_destino (str): Dirección de destino del envío
        estado_actual (str): Estado actual del envío (SOLICITADO, EN_TRANSITO, ENTREGADO, etc.)
        rut_remitente (str): RUT del usuario que crea el envío (Llave Foránea)
        created_at (datetime): Fecha de creación del registro
        updated_at (datetime): Fecha de última actualización
    """
    
    __tablename__ = 'assets'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    direccion_origen = db.Column(db.String(500), nullable=False)
    direccion_destino = db.Column(db.String(500), nullable=False)
    estado_actual = db.Column(db.String(50), nullable=False, default='SOLICITADO')
    rut_remitente = db.Column(db.String(12), db.ForeignKey('usuarios.rut'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con Usuario
    usuario = db.relationship('Usuario', backref=db.backref('assets', lazy=True))
    
    def __repr__(self):
        return f'<Asset {self.id} - {self.nombre}>'
    
    def to_dict(self):
        """
        Convierte el asset a diccionario
        
        Returns:
            dict: Representación del asset
        """
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'direccion_origen': self.direccion_origen,
            'direccion_destino': self.direccion_destino,
            'estado_actual': self.estado_actual,
            'rut_remitente': self.rut_remitente,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
