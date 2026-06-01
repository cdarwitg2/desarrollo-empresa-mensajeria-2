"""
Rutas de autenticación (Login)
Gestiona la autenticación de usuarios y generación de JWT
"""
from flask import request, jsonify
from flask_jwt_extended import create_access_token
from app.auth import auth_bp
from app.models import Usuario
from app import db
from datetime import datetime

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint de login que genera un JWT
    
    Request JSON:
        {
            "rut": "12345678-9",
            "password": "contraseña_segura"
        }
    
    Response (200 OK):
        {
            "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "nombre": "Juan Pérez",
            "roles": ["operador", "analista"],
            "rut": "12345678-9"
        }
    
    Response (400 Bad Request):
        {
            "error": "RUT y contraseña son requeridos"
        }
    
    Response (401 Unauthorized):
        {
            "error": "Credenciales inválidas"
        }
    
    Returns:
        tuple: (JSON response, HTTP status code)
    """
    try:
        # Obtener datos del request
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body es requerido"}), 400
        
        rut = data.get('rut', '').strip()
        password = data.get('password', '')
        
        # Validar que ambos campos estén presentes
        if not rut or not password:
            return jsonify({"error": "RUT y contraseña son requeridos"}), 400
        
        # Buscar el usuario por RUT
        usuario = Usuario.query.filter_by(rut=rut).first()
        
        # Verificar si el usuario existe y la contraseña es correcta
        if not usuario or not usuario.check_password(password):
            return jsonify({"error": "Credenciales inválidas"}), 401
        
        # Verificar si el usuario está activo
        if not usuario.activo:
            return jsonify({"error": "Usuario inactivo"}), 401
        
        # Crear payload para el JWT
        payload = {
            'rut': usuario.rut,
            'nombre_completo': usuario.nombre_completo,
            'roles': usuario.get_roles_list()
        }
        
        # Generar el token JWT
        access_token = create_access_token(identity=usuario.rut, additional_claims=payload)
        
        # Actualizar última conexión
        usuario.ultima_conexion = datetime.utcnow()
        db.session.commit()
        
        # Respuesta exitosa
        return jsonify({
            'token': access_token,
            'nombre': usuario.nombre_completo,
            'roles': usuario.get_roles_list(),
            'rut': usuario.rut
        }), 200
    
    except Exception as e:
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


@auth_bp.route('/health', methods=['GET'])
def health():
    """
    Endpoint para verificar el estado del servicio de autenticación
    
    Returns:
        tuple: (JSON response, HTTP status code)
    """
    return jsonify({"status": "healthy"}), 200
