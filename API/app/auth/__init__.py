"""
Blueprint de autenticación
Gestiona las rutas de autenticación del sistema
"""
from flask import Blueprint

# Definir el blueprint sin `url_prefix` para evitar duplicar el prefijo
auth_bp = Blueprint('auth', __name__)

from app.auth import routes
