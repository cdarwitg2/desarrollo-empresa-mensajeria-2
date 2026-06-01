"""
Blueprint para rutas administrativas
Gestiona CRUD de usuarios y validaciones de acceso
"""
from flask import Blueprint

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

from . import routes
