# Configuración de la aplicación Flask
import os
from dotenv import load_dotenv
import secrets

load_dotenv()

class Config:
    """Configuración base"""
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///tracking.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', secrets.token_urlsafe(32))
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hora

class DevelopmentConfig(Config):
    """Configuración de desarrollo"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Configuración de producción"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Configuración de testing"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
