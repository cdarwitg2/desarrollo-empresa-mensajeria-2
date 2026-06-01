"""
Rutas administrativas (CRUD de usuarios)
Solo accesibles por usuarios con rol 'administrador'
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from . import admin_bp
from app.models import Usuario
from app import db
from werkzeug.security import generate_password_hash


def require_admin():
    """
    Verificar que el usuario autenticado tiene rol de administrador
    Retorna error 403 si no es admin
    """
    claims = get_jwt()
    roles = claims.get('roles', [])
    
    if 'administrador' not in roles:
        return False
    
    return True


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """
    Obtiene la lista completa de usuarios del sistema
    
    Solo accesible por usuarios con rol 'administrador'
    
    Returns:
        JSON con lista de usuarios y sus detalles
    """
    try:
        # Validar que sea administrador
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        # Obtener todos los usuarios
        usuarios = Usuario.query.all()
        
        return jsonify({
            'success': True,
            'total': len(usuarios),
            'users': [usuario.to_dict() for usuario in usuarios]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener usuarios: {str(e)}'}), 500


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """
    Crea un nuevo usuario en el sistema
    
    Solo accesible por usuarios con rol 'administrador'
    
    Body JSON requerido:
        - rut (str): RUT del usuario (formato: 12345678-9)
        - nombre_completo (str): Nombre completo del usuario
        - password (str): Contraseña en texto plano
        - roles (list or str): Roles del usuario (ej: ['operador'] o 'operador,analista')
    
    Returns:
        JSON con confirmación y detalles del usuario creado
    """
    try:
        # Validar que sea administrador
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        # Obtener datos del body
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        # Extraer campos
        rut = data.get('rut', '').strip()
        nombre_completo = data.get('nombre_completo', '').strip()
        password = data.get('password', '')
        roles = data.get('roles', ['usuario'])
        
        # Validar que los campos requeridos estén presentes
        if not rut:
            return jsonify({'error': 'El campo "rut" es obligatorio'}), 400
        if not nombre_completo:
            return jsonify({'error': 'El campo "nombre_completo" es obligatorio'}), 400
        if not password:
            return jsonify({'error': 'El campo "password" es obligatorio'}), 400
        
        # Verificar que el usuario no exista ya
        usuario_existente = Usuario.query.filter_by(rut=rut).first()
        if usuario_existente:
            return jsonify({'error': f'El usuario con RUT {rut} ya existe'}), 400
        
        # Crear nuevo usuario
        nuevo_usuario = Usuario(
            rut=rut,
            nombre_completo=nombre_completo
        )
        
        # Encriptar y asignar contraseña
        nuevo_usuario.set_password(password)
        
        # Asignar roles
        if isinstance(roles, str):
            nuevo_usuario.set_roles(roles)
        else:
            nuevo_usuario.set_roles(roles)
        
        # Guardar en BD
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Usuario {rut} creado exitosamente',
            'user': nuevo_usuario.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al crear el usuario: {str(e)}'}), 500


@admin_bp.route('/users/<rut>', methods=['PUT'])
@jwt_required()
def update_user(rut):
    """
    Modifica los datos de un usuario existente
    
    Solo accesible por usuarios con rol 'administrador'
    
    Args:
        rut (str): RUT del usuario a modificar
    
    Body JSON (campos opcionales):
        - nombre_completo (str): Nuevo nombre del usuario
        - password (str): Nueva contraseña
        - roles (list or str): Nuevos roles del usuario
        - activo (bool): Estado del usuario
    
    Returns:
        JSON con confirmación y detalles del usuario actualizado
    """
    try:
        # Validar que sea administrador
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        # Obtener el admin autenticado
        claims = get_jwt()
        rut_admin = claims.get('rut')
        
        # Validar que no intente modificarse a sí mismo
        if rut == rut_admin:
            return jsonify({
                'error': 'No puedes degradar ni eliminar tu propia cuenta de administrador'
            }), 400
        
        # Obtener datos del body
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        # Buscar el usuario
        usuario = Usuario.query.filter_by(rut=rut).first()
        
        if not usuario:
            return jsonify({'error': f'Usuario con RUT {rut} no encontrado'}), 404
        
        # Actualizar campos si se proporcionan
        if 'nombre_completo' in data and data['nombre_completo']:
            usuario.nombre_completo = data['nombre_completo'].strip()
        
        if 'password' in data and data['password']:
            usuario.set_password(data['password'])
        
        if 'roles' in data:
            usuario.set_roles(data['roles'])
        
        if 'activo' in data:
            usuario.activo = bool(data['activo'])
        
        # Guardar cambios
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Usuario {rut} actualizado exitosamente',
            'user': usuario.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al actualizar el usuario: {str(e)}'}), 500


@admin_bp.route('/users/<rut>', methods=['DELETE'])
@jwt_required()
def delete_user(rut):
    """
    Elimina permanentemente un usuario del sistema
    
    Solo accesible por usuarios con rol 'administrador'
    
    Args:
        rut (str): RUT del usuario a eliminar
    
    Returns:
        JSON con confirmación de eliminación
    """
    try:
        # Validar que sea administrador
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        # Obtener el admin autenticado
        claims = get_jwt()
        rut_admin = claims.get('rut')
        
        # Validar que no intente eliminarse a sí mismo
        if rut == rut_admin:
            return jsonify({
                'error': 'No puedes degradar ni eliminar tu propia cuenta de administrador'
            }), 400
        
        # Buscar el usuario
        usuario = Usuario.query.filter_by(rut=rut).first()
        
        if not usuario:
            return jsonify({'error': f'Usuario con RUT {rut} no encontrado'}), 404
        
        # Eliminar usuario
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Usuario {rut} eliminado exitosamente'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al eliminar el usuario: {str(e)}'}), 500
