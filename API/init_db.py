"""
Script para inicializar la base de datos con usuarios de prueba
"""
import os
from app import create_app, db
from app.models import Usuario

def init_db():
    """Inicializa la BD y crea usuarios de prueba"""
    
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    with app.app_context():
        # Crear todas las tablas
        db.create_all()
        print("✓ Tablas creadas")
        
        # Crear usuarios de prueba si no existen
        usuarios_prueba = [
            {
                'rut': '11111111-1',
                'nombre_completo': 'Roberto Cliente',
                'password': 'password000',
                'roles': ['usuario']
            },
            {
                'rut': '12345678-9',
                'nombre_completo': 'Juan Pérez',
                'password': 'password123',
                'roles': ['operador', 'analista']
            },
            {
                'rut': '98765432-1',
                'nombre_completo': 'María García',
                'password': 'password456',
                'roles': ['administrador']
            },
            {
                'rut': '55555555-5',
                'nombre_completo': 'Carlos López',
                'password': 'password789',
                'roles': ['operador']
            }
        ]
        
        for usuario_data in usuarios_prueba:
            # Verificar si el usuario ya existe
            if not Usuario.query.filter_by(rut=usuario_data['rut']).first():
                usuario = Usuario(
                    rut=usuario_data['rut'],
                    nombre_completo=usuario_data['nombre_completo']
                )
                usuario.set_password(usuario_data['password'])
                usuario.set_roles(usuario_data['roles'])
                db.session.add(usuario)
                print(f"✓ Usuario creado: {usuario_data['rut']} - {usuario_data['nombre_completo']}")
            else:
                print(f"ℹ Usuario ya existe: {usuario_data['rut']}")
        
        db.session.commit()
        print("\n✓ Base de datos inicializada correctamente")
        print("\nUsuarios de prueba disponibles:")
        print("  1. RUT: 11111111-1, Pass: password000 (rol: usuario - CLIENTE)")
        print("  2. RUT: 12345678-9, Pass: password123 (roles: operador, analista)")
        print("  3. RUT: 98765432-1, Pass: password456 (rol: administrador)")
        print("  4. RUT: 55555555-5, Pass: password789 (rol: operador)")

if __name__ == '__main__':
    init_db()
