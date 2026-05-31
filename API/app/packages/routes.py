"""
Rutas para gestión de paquetes/assets
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from . import packages_bp
from app import db
from app.models import Asset, Usuario, CustodyLog


@packages_bp.route('/create', methods=['POST'])
@jwt_required()
def create_package():
    """
    Crea un nuevo paquete/asset para trazabilidad
    
    Extrae el rut del usuario remitente desde el token JWT.
    
    Body JSON requerido:
        - nombre (str): Nombre del paquete
        - descripcion (str): Descripción del contenido
        - direccion_origen (str): Dirección de origen
        - direccion_destino (str): Dirección de destino
    
    Returns:
        JSON con el ID del paquete creado o error
    """
    try:
        # Obtener el rut del token JWT
        claims = get_jwt()
        rut_remitente = claims.get('rut')
        
        if not rut_remitente:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener datos del body
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        # Extraer campos
        nombre = data.get('nombre', '').strip()
        descripcion = data.get('descripcion', '').strip()
        direccion_origen = data.get('direccion_origen', '').strip()
        direccion_destino = data.get('direccion_destino', '').strip()
        
        # Validar que ningún campo esté vacío
        if not nombre:
            return jsonify({'error': 'El campo "nombre" es obligatorio'}), 400
        if not descripcion:
            return jsonify({'error': 'El campo "descripcion" es obligatorio'}), 400
        if not direccion_origen:
            return jsonify({'error': 'El campo "direccion_origen" es obligatorio'}), 400
        if not direccion_destino:
            return jsonify({'error': 'El campo "direccion_destino" es obligatorio'}), 400
        
        # Verificar que el usuario remitente existe
        usuario = Usuario.query.filter_by(rut=rut_remitente).first()
        if not usuario:
            return jsonify({'error': 'Usuario remitente no encontrado'}), 404
        
        # Crear el nuevo asset
        nuevo_asset = Asset(
            nombre=nombre,
            descripcion=descripcion,
            direccion_origen=direccion_origen,
            direccion_destino=direccion_destino,
            estado_actual='SOLICITADO',
            rut_remitente=rut_remitente
        )
        
        # Guardar en BD
        db.session.add(nuevo_asset)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Paquete creado exitosamente',
            'id': nuevo_asset.id,
            'asset': nuevo_asset.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al crear el paquete: {str(e)}'}), 500


@packages_bp.route('/list', methods=['GET'])
@jwt_required()
def list_packages():
    """
    Lista todos los paquetes del usuario autenticado
    
    Returns:
        JSON con lista de paquetes del usuario
    """
    try:
        claims = get_jwt()
        rut_usuario = claims.get('rut')
        
        if not rut_usuario:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener todos los paquetes del usuario
        assets = Asset.query.filter_by(rut_remitente=rut_usuario).all()
        
        return jsonify({
            'success': True,
            'total': len(assets),
            'assets': [asset.to_dict() for asset in assets]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener paquetes: {str(e)}'}), 500


@packages_bp.route('/<int:asset_id>', methods=['GET'])
@jwt_required()
def get_package(asset_id):
    """
    Obtiene los detalles de un paquete específico
    
    Args:
        asset_id (int): ID del paquete
    
    Returns:
        JSON con los detalles del paquete
    """
    try:
        claims = get_jwt()
        rut_usuario = claims.get('rut')
        
        if not rut_usuario:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener el asset
        asset = Asset.query.filter_by(id=asset_id, rut_remitente=rut_usuario).first()
        
        if not asset:
            return jsonify({'error': 'Paquete no encontrado'}), 404
        
        return jsonify({
            'success': True,
            'asset': asset.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener el paquete: {str(e)}'}), 500


@packages_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_packages():
    """
    Obtiene todos los paquetes en estado SOLICITADO
    
    Requiere rol de trabajador (operador, analista o administrador)
    
    Returns:
        JSON con lista de paquetes pendientes
    """
    try:
        claims = get_jwt()
        rut_responsable = claims.get('rut')
        
        if not rut_responsable:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener todos los paquetes con estado SOLICITADO
        pending_packages = Asset.query.filter_by(estado_actual='SOLICITADO').all()
        
        return jsonify({
            'success': True,
            'total': len(pending_packages),
            'packages': [pkg.to_dict() for pkg in pending_packages]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener paquetes pendientes: {str(e)}'}), 500


@packages_bp.route('/update-status', methods=['POST'])
@jwt_required()
def update_package_status():
    """
    Actualiza el estado de un paquete y registra automáticamente en CustodyLog
    
    Requiere rol de trabajador (operador, analista o administrador)
    
    Body JSON requerido:
        - id_activo (int): ID del paquete
        - nuevo_estado (str): Nuevo estado del paquete
        - integridad (str, optional): Estado físico del paquete (para simulación de daño)
    
    Returns:
        JSON con confirmación de actualización y registro del log
    """
    try:
        claims = get_jwt()
        rut_responsable = claims.get('rut')
        
        if not rut_responsable:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener datos del body
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        id_activo = data.get('id_activo')
        nuevo_estado = data.get('nuevo_estado', '').strip()
        integridad = data.get('integridad', '').strip()
        
        # Validar que existan los campos requeridos
        if not id_activo:
            return jsonify({'error': 'El campo "id_activo" es obligatorio'}), 400
        if not nuevo_estado:
            return jsonify({'error': 'El campo "nuevo_estado" es obligatorio'}), 400
        
        # Obtener el asset
        asset = Asset.query.filter_by(id=id_activo).first()
        
        if not asset:
            return jsonify({'error': 'Paquete no encontrado'}), 404
        
        # Verificar que el usuario responsable existe
        usuario = Usuario.query.filter_by(rut=rut_responsable).first()
        
        if not usuario:
            return jsonify({'error': 'Usuario responsable no encontrado'}), 404
        
        # Determinar el tipo de alerta según el estado
        tipo_alerta = 'estándar'
        if nuevo_estado == 'EN_DISPUTA':
            tipo_alerta = 'crítico'
        elif asset.estado_actual == 'EN_DISPUTA' and nuevo_estado != 'EN_DISPUTA':
            tipo_alerta = 'resolución'
        
        # Guardar estado anterior para el log
        estado_anterior = asset.estado_actual
        
        # Actualizar estado del asset
        asset.estado_actual = nuevo_estado
        
        # Actualizar integridad si se proporciona
        if integridad:
            asset.integridad = integridad
        
        # Crear registro en CustodyLog
        custody_log = CustodyLog(
            id_activo=id_activo,
            rut_responsable=rut_responsable,
            estado_instante=nuevo_estado,
            tipo_alerta=tipo_alerta
        )
        
        # Guardar cambios
        db.session.add(custody_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Estado actualizado de {estado_anterior} a {nuevo_estado}',
            'asset': asset.to_dict(),
            'log': custody_log.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al actualizar el paquete: {str(e)}'}), 500


@packages_bp.route('/<int:asset_id>/logs', methods=['GET'])
@jwt_required()
def get_package_logs(asset_id):
    """
    Obtiene todos los registros de custodia (logs) de un paquete específico
    
    Args:
        asset_id (int): ID del paquete
    
    Returns:
        JSON con lista de logs del paquete ordenados por fecha
    """
    try:
        claims = get_jwt()
        rut_usuario = claims.get('rut')
        
        if not rut_usuario:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Verificar que el paquete existe
        asset = Asset.query.filter_by(id=asset_id).first()
        
        if not asset:
            return jsonify({'error': 'Paquete no encontrado'}), 404
        
        # Obtener todos los logs del paquete ordenados por fecha descendente
        logs = CustodyLog.query.filter_by(id_activo=asset_id).order_by(CustodyLog.timestamp.desc()).all()
        
        return jsonify({
            'success': True,
            'asset_id': asset_id,
            'asset_nombre': asset.nombre,
            'asset_estado': asset.estado_actual,
            'total_logs': len(logs),
            'logs': [log.to_dict() for log in logs]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener logs: {str(e)}'}), 500
