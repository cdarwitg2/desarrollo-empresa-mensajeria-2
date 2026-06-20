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


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint de registro de nuevos usuarios
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body es requerido"}), 400
        
        rut = data.get('rut', '').strip()
        nombre = data.get('nombre', '').strip()
        password = data.get('password', '')
        
        if not rut or not nombre or not password:
            return jsonify({"error": "Todos los campos son requeridos"}), 400
            
        # Verificar si el usuario ya existe
        usuario_existente = Usuario.query.filter_by(rut=rut).first()
        if usuario_existente:
            return jsonify({"error": "El RUT ya está registrado"}), 409
            
        # Crear nuevo usuario con rol de remitente/cliente por defecto
        nuevo_usuario = Usuario(
            rut=rut,
            nombre_completo=nombre
        )
        nuevo_usuario.set_password(password)
        nuevo_usuario.set_roles(['usuario'])
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        # Crear payload para el JWT
        payload = {
            'rut': nuevo_usuario.rut,
            'nombre_completo': nuevo_usuario.nombre_completo,
            'roles': nuevo_usuario.get_roles_list()
        }
        
        # Generar token y hacer login automático
        access_token = create_access_token(identity=nuevo_usuario.rut, additional_claims=payload)
        nuevo_usuario.ultima_conexion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'token': access_token,
            'nombre': nuevo_usuario.nombre_completo,
            'roles': nuevo_usuario.get_roles_list(),
            'rut': nuevo_usuario.rut
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500


@auth_bp.route('/health', methods=['GET'])
def health():
    """
    Endpoint para verificar el estado del servicio de autenticación
    
    Returns:
        tuple: (JSON response, HTTP status code)
    """
    return jsonify({"status": "healthy"}), 200
