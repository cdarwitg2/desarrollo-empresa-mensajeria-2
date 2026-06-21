"""
Blueprint para rutas administrativas
Gestiona CRUD de usuarios y validaciones de acceso
"""
from flask import Blueprint

# Registrar sin `url_prefix` aquí; se aplica al registrar el blueprint en la app
admin_bp = Blueprint('admin', __name__)

from . import routes
