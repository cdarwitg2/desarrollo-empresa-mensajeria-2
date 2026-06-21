"""
Factory de la aplicación Flask
Inicializa extensiones y configura blueprints
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config

# Inicializar extensiones
db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='development'):
    """
    Factory para crear la aplicación Flask
    """
    app = Flask(__name__)
    
    # Cargar configuración
    app.config.from_object(config[config_name])
    
    # Inicializar extensiones
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"], supports_credentials=True)
    
    # Registrar blueprints
    from app.auth import auth_bp
    from app.packages import packages_bp
    from app.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(packages_bp)
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Crear tablas
    with app.app_context():
        db.create_all()
    
    return app