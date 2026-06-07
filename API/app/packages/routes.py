"""
Rutas para gestión de paquetes/activos (assets)
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from . import packages_bp
from app import db
from app.models import Activo, Usuario, CustodyLog, EstadoActivo
from datetime import datetime, timedelta
import random
import string


@packages_bp.route('/create', methods=['POST'])
@jwt_required()
def create_package():
    """
    Crea un nuevo paquete/activo para trazabilidad
    
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
        
        # Crear el nuevo activo
        nuevo_activo = Activo(
            nombre=nombre,
            descripcion=descripcion,
            direccion_origen=direccion_origen,
            direccion_destino=direccion_destino,
            estado_actual=EstadoActivo.SOLICITADO,
            rut_remitente=rut_remitente
        )
        
        # Guardar en BD
        db.session.add(nuevo_activo)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Paquete creado exitosamente',
            'id': nuevo_activo.id_activo,
            'asset': nuevo_activo.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al crear el paquete: {str(e)}'}), 500


@packages_bp.route('/list', methods=['GET'])
@jwt_required()
def list_packages():
    """
    Lista todos los paquetes del usuario autenticado
    """
    try:
        claims = get_jwt()
        rut_usuario = claims.get('rut')
        
        if not rut_usuario:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener todos los paquetes del usuario
        activos = Activo.query.filter_by(rut_remitente=rut_usuario).all()
        
        return jsonify({
            'success': True,
            'total': len(activos),
            'assets': [activo.to_dict() for activo in activos]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener paquetes: {str(e)}'}), 500


@packages_bp.route('/my-packages', methods=['GET'])
@jwt_required()
def get_my_packages():
    """
    Obtiene el historial de todos los paquetes enviados por el usuario autenticado
    """
    try:
        claims = get_jwt()
        rut_usuario = claims.get('rut')
        
        if not rut_usuario:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener todos los paquetes del usuario remitente
        activos = Activo.query.filter_by(rut_remitente=rut_usuario).all()
        
        return jsonify({
            'success': True,
            'rut_usuario': rut_usuario,
            'total': len(activos),
            'packages': [activo.to_dict() for activo in activos]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener historial de paquetes: {str(e)}'}), 500


@packages_bp.route('/<string:id_activo>', methods=['GET'])
@jwt_required()
def get_package(id_activo):
    """
    Obtiene los detalles de un paquete específico
    """
    try:
        claims = get_jwt()
        rut_usuario = claims.get('rut')
        
        if not rut_usuario:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener el activo
        activo = Activo.query.filter_by(id_activo=id_activo, rut_remitente=rut_usuario).first()
        
        if not activo:
            return jsonify({'error': 'Paquete no encontrado'}), 404
        
        return jsonify({
            'success': True,
            'asset': activo.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener el paquete: {str(e)}'}), 500


@packages_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_packages():
    """
    Obtiene todos los paquetes excepto los ENTREGADO
    """
    try:
        claims = get_jwt()
        rut_responsable = claims.get('rut')
        
        if not rut_responsable:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Obtener todos los paquetes excepto los ENTREGADO
        pending_packages = Activo.query.filter(Activo.estado_actual != EstadoActivo.ENTREGADO).all()
        
        return jsonify({
            'success': True,
            'total': len(pending_packages),
            'packages': [pkg.to_dict() for pkg in pending_packages]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener paquetes pendientes: {str(e)}'}), 500


@packages_bp.route('/filter', methods=['GET'])
@jwt_required()
def filter_packages():
    """
    Filtra paquetes por estado
    """
    try:
        claims = get_jwt()
        rut_responsable = claims.get('rut')
        
        if not rut_responsable:
            return jsonify({'error': 'Token inválido'}), 401
        
        estado_str = request.args.get('estado', '').strip()
        
        if estado_str:
            try:
                estado_enum = EstadoActivo[estado_str.upper()]
                activos = Activo.query.filter_by(estado_actual=estado_enum).all()
            except KeyError:
                try:
                    estado_enum = EstadoActivo(estado_str.lower())
                    activos = Activo.query.filter_by(estado_actual=estado_enum).all()
                except ValueError:
                    return jsonify({'error': f'Estado de filtro inválido: {estado_str}'}), 400
        else:
            activos = Activo.query.all()
        
        return jsonify({
            'success': True,
            'filter': estado_str if estado_str else 'todos',
            'total': len(activos),
            'packages': [pkg.to_dict() for pkg in activos]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al filtrar paquetes: {str(e)}'}), 500


@packages_bp.route('/<string:id_activo>/generar-contingencia', methods=['POST'])
@jwt_required()
def generar_contingencia(id_activo):
    """
    Genera un token de contingencia dinámico en caso de que la captura de hardware falle.
    """
    try:
        claims = get_jwt()
        rut_responsable = claims.get('rut')
        
        if not rut_responsable:
            return jsonify({'error': 'Token inválido'}), 401
            
        activo = Activo.query.filter_by(id_activo=id_activo).first()
        if not activo:
            return jsonify({'error': 'Paquete no encontrado'}), 404
            
        usuario = Usuario.query.filter_by(rut=rut_responsable).first()
        if not usuario:
            return jsonify({'error': 'Usuario responsable no encontrado'}), 404
            
        # Generar código de 6 caracteres (ej: EXP-99)
        chars = string.ascii_uppercase + string.digits
        token = ''.join(random.choices(chars, k=6))
        
        activo.token_contingencia = token
        # Expira en 30 minutos
        activo.token_expira = datetime.utcnow() + timedelta(minutes=30)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Token de contingencia generado',
            'token_contingencia': token,
            'expira': activo.token_expira.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al generar contingencia: {str(e)}'}), 500


@packages_bp.route('/<string:id_activo>/estado', methods=['PATCH'])
@jwt_required()
def update_package_status(id_activo):
    """
    Actualiza el estado de un paquete y registra automáticamente en CustodyLog
    Valida la transición según la máquina de estados.
    """
    try:
        claims = get_jwt()
        rut_responsable = claims.get('rut')
        
        if not rut_responsable:
            return jsonify({'error': 'Token inválido'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        nuevo_estado_str = data.get('estado', '').strip()
        integridad = data.get('integridad', '').strip()
        
        if not nuevo_estado_str:
            return jsonify({'error': 'El campo "estado" es obligatorio'}), 400
            
        try:
            nuevo_estado_enum = EstadoActivo[nuevo_estado_str.upper()]
        except KeyError:
            try:
                nuevo_estado_enum = EstadoActivo(nuevo_estado_str.lower())
            except ValueError:
                return jsonify({'error': f'Estado no válido: {nuevo_estado_str}'}), 400
        
        activo = Activo.query.filter_by(id_activo=id_activo).first()
        if not activo:
            return jsonify({'error': 'Paquete no encontrado'}), 404
        
        usuario = Usuario.query.filter_by(rut=rut_responsable).first()
        if not usuario:
            return jsonify({'error': 'Usuario responsable no encontrado'}), 404
            
        token_ingresado = data.get('token_contingencia', '').strip()
        usar_offline_sync = False
        
        if token_ingresado:
            if not activo.token_contingencia:
                return jsonify({'error': 'Este activo no tiene contingencia generada.'}), 400
                
            if activo.token_contingencia.upper() != token_ingresado.upper():
                return jsonify({'error': 'Token de contingencia inválido.'}), 403
                
            if activo.token_expira and datetime.utcnow() > activo.token_expira:
                return jsonify({'error': 'El token de contingencia ha expirado.'}), 403
                
            # Token válido: destruirlo para un solo uso
            activo.token_contingencia = None
            activo.token_expira = None
            usar_offline_sync = True

        # Máquina de estados: Validar transición
        estado_actual = activo.estado_actual
        
        transiciones_validas = {
            EstadoActivo.SOLICITADO: [EstadoActivo.EN_TRANSITO],
            EstadoActivo.EN_TRANSITO: [EstadoActivo.EN_ACOPIO, EstadoActivo.ENTREGADO, EstadoActivo.EN_DISPUTA],
            EstadoActivo.EN_ACOPIO: [EstadoActivo.EN_TRANSITO, EstadoActivo.ENTREGADO, EstadoActivo.EN_DISPUTA],
            EstadoActivo.EN_DISPUTA: [EstadoActivo.EN_TRANSITO, EstadoActivo.EN_ACOPIO, EstadoActivo.ENTREGADO],
            EstadoActivo.ENTREGADO: [] # Estado final
        }
        
        # Si el estado actual no existe (es nuevo), asumimos que era SOLICITADO o no tiene restricciones para el primer salto
        estados_permitidos = transiciones_validas.get(estado_actual, []) if estado_actual else [EstadoActivo.SOLICITADO, EstadoActivo.EN_TRANSITO]
        
        # Opcional: permitir volver al mismo estado si solo queremos actualizar integridad (idempotencia parcial)
        if nuevo_estado_enum != estado_actual and nuevo_estado_enum not in estados_permitidos:
            return jsonify({
                'error': f'Transición inválida. Un paquete en estado {estado_actual.value if estado_actual else "N/A"} no puede pasar a {nuevo_estado_enum.value}.'
            }), 409
        
        tipo_alerta = 'estándar'
        if nuevo_estado_enum == EstadoActivo.EN_DISPUTA:
            tipo_alerta = 'crítico'
        elif activo.estado_actual == EstadoActivo.EN_DISPUTA and nuevo_estado_enum != EstadoActivo.EN_DISPUTA:
            tipo_alerta = 'resolución'
        
        estado_anterior = activo.estado_actual.value if activo.estado_actual else 'Desconocido'
        activo.estado_actual = nuevo_estado_enum
        
        if integridad:
            activo.integridad = integridad
        
        custody_log = CustodyLog(
            id_activo=id_activo,
            rut_responsable=rut_responsable,
            estado_instante=nuevo_estado_enum.value,
            tipo_alerta=tipo_alerta,
            is_offline_sync=usar_offline_sync
        )
        
        db.session.add(custody_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Estado actualizado de {estado_anterior} a {nuevo_estado_enum.value}',
            'asset': activo.to_dict(),
            'log': custody_log.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al actualizar el paquete: {str(e)}'}), 500


@packages_bp.route('/<string:id_activo>/logs', methods=['GET'])
@jwt_required()
def get_package_logs(id_activo):
    """
    Obtiene todos los registros de custodia (logs) de un paquete específico
    """
    try:
        claims = get_jwt()
        rut_usuario = claims.get('rut')
        
        if not rut_usuario:
            return jsonify({'error': 'Token inválido'}), 401
        
        activo = Activo.query.filter_by(id_activo=id_activo).first()
        
        if not activo:
            return jsonify({'error': 'Paquete no encontrado'}), 404
        
        logs = CustodyLog.query.filter_by(id_activo=id_activo).order_by(CustodyLog.timestamp.desc()).all()
        
        return jsonify({
            'success': True,
            'asset_id': id_activo,
            'asset_nombre': activo.nombre,
            'asset_estado': activo.estado_actual.value if activo.estado_actual else None,
            'total_logs': len(logs),
            'logs': [log.to_dict() for log in logs]
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Error al obtener logs: {str(e)}'}), 500
