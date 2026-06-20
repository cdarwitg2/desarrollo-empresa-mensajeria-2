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
    app.register_blueprint(packages_bp)  # ✅ Sin url_prefix porque ya lo tiene
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Crear tablas y asegurar que existan las nuevas columnas
    with app.app_context():
        db.create_all()
        
        # Inyectar columnas nuevas en activos si no existen
        columnas_nuevas = [
            "lat REAL",
            "lng REAL",
            "token_contingencia VARCHAR(6)",
            "token_expira DATETIME",
            "is_blocked BOOLEAN DEFAULT 0 NOT NULL",
            "tiempo_asignacion DATETIME"
        ]
        
        for col in columnas_nuevas:
            try:
                db.session.execute(db.text(f"ALTER TABLE activos ADD COLUMN {col}"))
                db.session.commit()
            except Exception:
                db.session.rollback()
    
    return app