import random
from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import enum

# -------------------------------------------------------------------------
# ENUMS OPERACIONALES (Garantizan la consistencia interna del modelo)
# -------------------------------------------------------------------------

class RolUsuario(enum.Enum):
    REMITENTE = "Remitente"
    MENSAJERO = "Mensajero"
    ACOPIO = "Acopio"
    ANALISTA = "Analista"
    ADMINISTRADOR = "Administrador"


class EstadoActivo(enum.Enum):
    SOLICITADO = "solicitado"
    EN_TRANSITO = "en_transito"
    EN_ACOPIO = "en_acopio"
    ENTREGA_PENDIENTE_SINCRONIZACION = "entrega_pendiente_sincronizacion"
    BLOQUEO_SEGURIDAD = "bloqueo_seguridad"
    EN_DISPUTA = "en_disputa"
    ENTREGADO = "entregado"
    RECIBIDO = "recibido"


# -------------------------------------------------------------------------
# GENERADORES DE IDS
# -------------------------------------------------------------------------

def generate_activo_id():
    """Genera un identificador único para el activo con formato IMP-XX"""
    return f"IMP-{random.randint(100, 999)}"


# -------------------------------------------------------------------------
# MODELOS ORM
# -------------------------------------------------------------------------

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    rut = db.Column(db.String(12), primary_key=True)  # Formato: 12.345.678-K
    nombre_completo = db.Column(db.String(100), nullable=False)
    rol = db.Column(db.Enum(RolUsuario), nullable=False)
    
    # Mejoras del archivo models.py original para autenticación y auditoría
    password_hash = db.Column(db.String(255), nullable=False)
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ultima_conexion = db.Column(db.DateTime, nullable=True)
    
    # Relación inversa para saber qué custodia ha tenido este usuario
    custodias = db.relationship('CustodyLog', backref='responsable', foreign_keys='CustodyLog.id_responsable', lazy=True)

    def __repr__(self):
        return f"<Usuario {self.rut} - {self.rol.value if self.rol else 'Sin Rol'}>"

    def set_password(self, password):
        """Encripta y guarda la contraseña"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """Verifica una contraseña contra el hash almacenado"""
        return check_password_hash(self.password_hash, password)

    def get_roles_list(self):
        """Obtiene la lista de roles del usuario en formato de cadenas compatibles con las rutas"""
        if not self.rol:
            return ['usuario']
        
        mapping = {
            RolUsuario.REMITENTE: 'usuario',
            RolUsuario.MENSAJERO: 'mensajero',
            RolUsuario.ACOPIO: 'acopio',
            RolUsuario.ANALISTA: 'analista',
            RolUsuario.ADMINISTRADOR: 'administrador'
        }
        return [mapping.get(self.rol, 'usuario')]

    def set_roles(self, roles):
        """Establece el rol del usuario a partir de una lista o cadena de roles"""
        if isinstance(roles, str):
            role_list = [r.strip().lower() for r in roles.split(',')]
        elif isinstance(roles, list):
            role_list = [r.strip().lower() if isinstance(r, str) else r for r in roles]
        else:
            role_list = ['usuario']
            
        for r in role_list:
            if r in ['usuario', 'remitente']:
                self.rol = RolUsuario.REMITENTE
                return
            elif r in ['mensajero']:
                self.rol = RolUsuario.MENSAJERO
                return
            elif r in ['acopio', 'operador']:
                self.rol = RolUsuario.ACOPIO
                return
            elif r in ['analista']:
                self.rol = RolUsuario.ANALISTA
                return
            elif r in ['administrador', 'admin']:
                self.rol = RolUsuario.ADMINISTRADOR
                return
        self.rol = RolUsuario.REMITENTE

    def to_dict(self):
        """Convierte el usuario a diccionario"""
        return {
            'rut': self.rut,
            'nombre_completo': self.nombre_completo,
            'rol': self.rol.value if self.rol else None,
            'roles': self.get_roles_list(),
            'activo': self.activo,
            'ultima_conexion': self.ultima_conexion.isoformat() if self.ultima_conexion else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Activo(db.Model):
    __tablename__ = 'activos'
    
    id_activo = db.Column(db.String(50), primary_key=True, default=generate_activo_id)  # Ej: "IMP-99"
    descripcion = db.Column(db.Text, nullable=False)
    valor_estimado = db.Column(db.Float, default=0.0, nullable=True)  # Por defecto 0.0 para compatibilidad
    estado_actual = db.Column(db.Enum(EstadoActivo), default=EstadoActivo.SOLICITADO, nullable=False)
    timestamp_registro = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Campos de models.py (Asset) para compatibilidad con vistas y lógica existentes
    nombre = db.Column(db.String(255), nullable=True)
    direccion_origen = db.Column(db.String(500), nullable=True)
    direccion_destino = db.Column(db.String(500), nullable=True)
    integridad = db.Column(db.String(50), nullable=True, default='Intacto')
    rut_remitente = db.Column(db.String(12), db.ForeignKey('usuarios.rut'), nullable=True)
    rut_mensajero = db.Column(db.String(12), db.ForeignKey('usuarios.rut'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Campos de Contingencia (Hardware Falla)
    token_contingencia = db.Column(db.String(6), nullable=True)
    token_expira = db.Column(db.DateTime, nullable=True)

    # Relación con Usuario para compatibilidad
    usuario = db.relationship('Usuario', foreign_keys=[rut_remitente], backref=db.backref('assets', lazy=True))

    # Relaciones de Trazabilidad
    # 1:N - Un activo genera un historial inmutable de cambios de manos
    custody_logs = db.relationship('CustodyLog', backref='activo', foreign_keys='CustodyLog.id_activo', lazy=True, cascade="all, delete-orphan")
    
    # 1:1 - Un activo en un momento dado puede abrir una incidencia (Disputa)
    issue_log = db.relationship('IssueLog', backref='activo', uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Activo {self.id_activo} - Status: {self.estado_actual.value if self.estado_actual else 'Sin Estado'}>"

    @property
    def id(self):
        """Propiedad alias para compatibilidad con backend que espera un atributo .id"""
        return self.id_activo

    @id.setter
    def id(self, value):
        self.id_activo = value

    def to_dict(self):
        """Convierte el activo a diccionario"""
        return {
            'id': self.id_activo,  # Alias de compatibilidad
            'id_activo': self.id_activo,
            'nombre': self.nombre or f"Activo {self.id_activo}",
            'descripcion': self.descripcion,
            'valor_estimado': self.valor_estimado,
            'direccion_origen': self.direccion_origen,
            'direccion_destino': self.direccion_destino,
            'estado_actual': self.estado_actual.value if self.estado_actual else None,
            'integridad': self.integridad,
            'rut_remitente': self.rut_remitente,
            'rut_mensajero': self.rut_mensajero,
            'timestamp_registro': self.timestamp_registro.isoformat() if self.timestamp_registro else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'token_contingencia': self.token_contingencia
        }


class CustodyLog(db.Model):
    __tablename__ = 'custody_logs'
    
    id_log = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_activo = db.Column(db.String(50), db.ForeignKey('activos.id_activo'), nullable=False)
    id_responsable = db.Column(db.String(12), db.ForeignKey('usuarios.rut'), nullable=False)
    timestamp_accion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    coordenadas_gps = db.Column(db.String(100), nullable=True)  # Permite nulo si la captura offline falla al inicio
    is_offline_sync = db.Column(db.Boolean, default=False, nullable=False) # True si se usó validación local/TOTP

    # Campos de models.py original para compatibilidad con código/controladores
    rut_responsable = db.Column(db.String(12), db.ForeignKey('usuarios.rut'), nullable=True)
    estado_instante = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    tipo_alerta = db.Column(db.String(20), nullable=True, default='estándar')

    # Relaciones adicionales de compatibilidad con modelos antiguos
    asset = db.relationship('Activo', foreign_keys=[id_activo], backref=db.backref('legacy_custody_logs', lazy=True, overlaps="custody_logs,activo"), overlaps="activo,custody_logs")
    usuario = db.relationship('Usuario', foreign_keys=[id_responsable], backref=db.backref('legacy_custody_logs', lazy=True, overlaps="custodias,responsable"), overlaps="custodias,responsable")

    def __init__(self, **kwargs):
        # Mapea rut_responsable a id_responsable para compatibilidad del constructor
        if 'rut_responsable' in kwargs and 'id_responsable' not in kwargs:
            kwargs['id_responsable'] = kwargs['rut_responsable']
        if 'id_responsable' in kwargs and 'rut_responsable' not in kwargs:
            kwargs['rut_responsable'] = kwargs['id_responsable']
        super(CustodyLog, self).__init__(**kwargs)

    def __repr__(self):
        return f"<CustodyLog {self.id_log}: Activo={self.id_activo} -> Responsable={self.id_responsable}>"

    @property
    def id(self):
        """Propiedad alias para compatibilidad con backend que espera un atributo .id"""
        return self.id_log

    @id.setter
    def id(self, value):
        self.id_log = value

    def to_dict(self):
        """Convierte el registro de custodia a diccionario"""
        return {
            'id': self.id_log,  # Alias de compatibilidad
            'id_log': self.id_log,
            'id_activo': self.id_activo,
            'id_responsable': self.id_responsable,
            'rut_responsable': self.rut_responsable or self.id_responsable,
            'estado_instante': self.estado_instante or (self.activo.estado_actual.value if self.activo else None),
            'timestamp_accion': self.timestamp_accion.isoformat() if self.timestamp_accion else None,
            'timestamp': (self.timestamp or self.timestamp_accion).isoformat(),
            'coordenadas_gps': self.coordenadas_gps,
            'is_offline_sync': self.is_offline_sync,
            'tipo_alerta': self.tipo_alerta
        }


class IssueLog(db.Model):
    __tablename__ = 'issue_logs'
    
    id_incidencia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_activo = db.Column(db.String(50), db.ForeignKey('activos.id_activo'), unique=True, nullable=False)
    tipo_falla = db.Column(db.String(100), nullable=False)  # Ej: "Sello Comprometido", "Daño Físico"
    comentario_analista = db.Column(db.Text, nullable=True)
    disposicion_fisica_final = db.Column(db.String(100), nullable=True) # Ej: "Devuelto al Remitente", "Dado de Baja"
    hash_acuerdo = db.Column(db.String(64), nullable=True)  # Token criptográfico que valida el dictamen final

    def __repr__(self):
        return f"<IssueLog {self.id_incidencia} para Activo {self.id_activo}>"

    def to_dict(self):
        """Convierte el registro de incidencia a diccionario"""
        return {
            'id_incidencia': self.id_incidencia,
            'id_activo': self.id_activo,
            'tipo_falla': self.tipo_falla,
            'comentario_analista': self.comentario_analista,
            'disposicion_fisica_final': self.disposicion_fisica_final,
            'hash_acuerdo': self.hash_acuerdo
        }

# Alias global para compatibilidad con código que importa Asset
Asset = Activo
