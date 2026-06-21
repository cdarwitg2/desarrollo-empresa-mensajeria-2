"""
Rutas administrativas (CRUD de usuarios y paquetes)
Solo accesibles por usuarios con rol 'administrador'
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from . import admin_bp
from app.models import Usuario, Activo, RolUsuario
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
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
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
        - rol (str): Rol del usuario (CLIENTE, OPERADOR, MENSAJERO, ANALISTA, ADMIN)
    
    Returns:
        JSON con confirmación y detalles del usuario creado
    """
    try:
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        rut = data.get('rut', '').strip()
        nombre_completo = data.get('nombre_completo', '').strip()
        password = data.get('password', '')
        rol = data.get('rol', 'CLIENTE')
        
        if not rut:
            return jsonify({'error': 'El campo "rut" es obligatorio'}), 400
        if not nombre_completo:
            return jsonify({'error': 'El campo "nombre_completo" es obligatorio'}), 400
        if not password:
            return jsonify({'error': 'El campo "password" es obligatorio'}), 400
        
        usuario_existente = Usuario.query.filter_by(rut=rut).first()
        if usuario_existente:
            return jsonify({'error': f'El usuario con RUT {rut} ya existe'}), 400
        
        # 👇 MAPEO CORRECTO DE ROLES (MAYÚSCULAS -> ENUM)
        rol_mapping = {
            'CLIENTE': RolUsuario.REMITENTE,
            'OPERADOR': RolUsuario.ACOPIO,
            'MENSAJERO': RolUsuario.MENSAJERO,
            'ANALISTA': RolUsuario.ANALISTA,
            'ADMIN': RolUsuario.ADMINISTRADOR
        }
        
        rol_enum = rol_mapping.get(rol.upper(), RolUsuario.REMITENTE)
        
        nuevo_usuario = Usuario(
            rut=rut,
            nombre_completo=nombre_completo,
            rol=rol_enum
        )
        
        nuevo_usuario.set_password(password)
        
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
        - rol (str): Nuevo rol del usuario
        - activo (bool): Estado del usuario
    
    Returns:
        JSON con confirmación y detalles del usuario actualizado
    """
    try:
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        claims = get_jwt()
        rut_admin = claims.get('rut')
        
        if rut == rut_admin:
            return jsonify({
                'error': 'No puedes modificar tu propia cuenta de administrador'
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        usuario = Usuario.query.filter_by(rut=rut).first()
        
        if not usuario:
            return jsonify({'error': f'Usuario con RUT {rut} no encontrado'}), 404
        
        if 'nombre_completo' in data and data['nombre_completo']:
            usuario.nombre_completo = data['nombre_completo'].strip()
        
        if 'password' in data and data['password']:
            usuario.set_password(data['password'])
        
        if 'rol' in data:
            # 👇 MAPEO CORRECTO DE ROLES
            rol_mapping = {
                'CLIENTE': RolUsuario.REMITENTE,
                'OPERADOR': RolUsuario.ACOPIO,
                'MENSAJERO': RolUsuario.MENSAJERO,
                'ANALISTA': RolUsuario.ANALISTA,
                'ADMIN': RolUsuario.ADMINISTRADOR
            }
            usuario.rol = rol_mapping.get(data['rol'].upper(), RolUsuario.REMITENTE)
        
        if 'activo' in data:
            usuario.activo = bool(data['activo'])
        
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
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        claims = get_jwt()
        rut_admin = claims.get('rut')
        
        if rut == rut_admin:
            return jsonify({
                'error': 'No puedes eliminar tu propia cuenta de administrador'
            }), 400
        
        usuario = Usuario.query.filter_by(rut=rut).first()
        
        if not usuario:
            return jsonify({'error': f'Usuario con RUT {rut} no encontrado'}), 404
        
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Usuario {rut} eliminado exitosamente'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al eliminar el usuario: {str(e)}'}), 500


# ============================================================
# ENDPOINTS ADMINISTRATIVOS PARA PAQUETES
# ============================================================

@admin_bp.route('/packages', methods=['GET'])
@jwt_required()
def list_packages():
    """
    Obtiene la lista completa de paquetes del sistema
    
    Solo accesible por usuarios con rol 'administrador'
    
    Returns:
        JSON con lista de paquetes y sus detalles
    """
    try:
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        # Ordenar por fecha de creación descendente
        paquetes = Activo.query.order_by(Activo.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'total': len(paquetes),
            'packages': [pkg.to_dict() for pkg in paquetes]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener paquetes: {str(e)}'}), 500


@admin_bp.route('/packages/<id_activo>', methods=['DELETE'])
@jwt_required()
def delete_package(id_activo):
    """
    Elimina permanentemente un paquete del sistema
    
    Solo accesible por usuarios con rol 'administrador'
    
    Args:
        id_activo (str): ID del paquete a eliminar
    
    Returns:
        JSON con confirmación de eliminación
    """
    try:
        if not require_admin():
            return jsonify({'error': 'Acceso denegado. Se requiere rol de administrador'}), 403
        
        paquete = Activo.query.filter_by(id_activo=id_activo).first()
        
        if not paquete:
            return jsonify({'error': f'Paquete con ID {id_activo} no encontrado'}), 404
        
        # Guardar información para el log
        nombre_paquete = paquete.nombre
        
        db.session.delete(paquete)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Paquete "{nombre_paquete}" ({id_activo}) eliminado exitosamente'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al eliminar el paquete: {str(e)}'}), 500