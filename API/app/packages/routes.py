"""
Rutas para gestión de paquetes/assets
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from . import packages_bp
from app import db
from app.models import Asset, Usuario


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
