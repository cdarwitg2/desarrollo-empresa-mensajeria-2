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
    Crea un nuevo paquete/activo para trazabilidad con coordenadas
    
    Body JSON:
        - nombre (str): Nombre del paquete
        - descripcion (str): Descripción del contenido
        - direccion_origen (str): Dirección de origen
        - direccion_destino (str): Dirección de destino
        - lat_origen (float, opcional): Latitud de origen
        - lng_origen (float, opcional): Longitud de origen
        - lat_destino (float, opcional): Latitud de destino
        - lng_destino (float, opcional): Longitud de destino
    """
    try:
        claims = get_jwt()
        rut_remitente = claims.get('rut')
        
        if not rut_remitente:
            return jsonify({'error': 'Token inválido'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        nombre = data.get('nombre', '').strip()
        descripcion = data.get('descripcion', '').strip()
        direccion_origen = data.get('direccion_origen', '').strip()
        direccion_destino = data.get('direccion_destino', '').strip()
        lat_origen = data.get('lat_origen')
        lng_origen = data.get('lng_origen')
        lat_destino = data.get('lat_destino')
        lng_destino = data.get('lng_destino')
        
        if not nombre:
            return jsonify({'error': 'El campo "nombre" es obligatorio'}), 400
        if not descripcion:
            return jsonify({'error': 'El campo "descripcion" es obligatorio'}), 400
        if not direccion_origen:
            return jsonify({'error': 'El campo "direccion_origen" es obligatorio'}), 400
        if not direccion_destino:
            return jsonify({'error': 'El campo "direccion_destino" es obligatorio'}), 400
        
        usuario = Usuario.query.filter_by(rut=rut_remitente).first()
        if not usuario:
            return jsonify({'error': 'Usuario remitente no encontrado'}), 404
        
        nuevo_activo = Activo(
            nombre=nombre,
            descripcion=descripcion,
            direccion_origen=direccion_origen,
            direccion_destino=direccion_destino,
            estado_actual=EstadoActivo.SOLICITADO,
            rut_remitente=rut_remitente,
            lat=lat_destino,  # Guardamos la latitud del destino para el mensajero
            lng=lng_destino   # Guardamos la longitud del destino para el mensajero
        )
        
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
    Obtiene todos los paquetes pendientes (excluye ENTREGADO y RECIBIDO)
    """
    try:
        claims = get_jwt()
        rut_responsable = claims.get('rut')
        
        if not rut_responsable:
            return jsonify({'error': 'Token inválido'}), 401
        
        estados_excluidos = [EstadoActivo.ENTREGADO, EstadoActivo.RECIBIDO]
        pending_packages = Activo.query.filter(~Activo.estado_actual.in_(estados_excluidos)).all()
        
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
    
    IMPORTANTE: Cuando un paquete llega a EN_ACOPIO, se limpia el rut_mensajero
    para que el operador pueda asignar un nuevo mensajero desde la pestaña de acopio.
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
        rut_mensajero = data.get('rut_mensajero', '').strip()
        
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
            EstadoActivo.EN_TRANSITO: [EstadoActivo.EN_ACOPIO, EstadoActivo.EN_DISPUTA],
            EstadoActivo.EN_ACOPIO: [EstadoActivo.EN_ACOPIO_ASIGNADO, EstadoActivo.EN_DISPUTA],
            EstadoActivo.EN_ACOPIO_ASIGNADO: [EstadoActivo.EN_TRANSITO_ENTREGA, EstadoActivo.EN_DISPUTA],
            EstadoActivo.EN_TRANSITO_ENTREGA: [EstadoActivo.ENTREGADO, EstadoActivo.EN_DISPUTA],
            EstadoActivo.EN_DISPUTA: [EstadoActivo.EN_TRANSITO, EstadoActivo.EN_ACOPIO, EstadoActivo.ENTREGADO, EstadoActivo.EN_TRANSITO_ENTREGA],
            EstadoActivo.ENTREGADO: [EstadoActivo.RECIBIDO],
            EstadoActivo.RECIBIDO: []
        }
        
        estados_permitidos = transiciones_validas.get(estado_actual, []) if estado_actual else [EstadoActivo.SOLICITADO, EstadoActivo.EN_TRANSITO]
        
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
        
        if nuevo_estado_enum == EstadoActivo.EN_ACOPIO:
            activo.rut_mensajero = None
            activo.tiempo_asignacion = None
        
        # Asignar mensajero solo si el nuevo estado lo requiere y se proporciona
        if rut_mensajero and nuevo_estado_enum in [EstadoActivo.EN_TRANSITO, EstadoActivo.EN_TRANSITO_ENTREGA, EstadoActivo.EN_ACOPIO_ASIGNADO]:
            activo.rut_mensajero = rut_mensajero
            # Si es EN_ACOPIO_ASIGNADO, registrar tiempo de asignación
            if nuevo_estado_enum == EstadoActivo.EN_ACOPIO_ASIGNADO:
                activo.tiempo_asignacion = datetime.utcnow()
        
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


# ============================================================
# NUEVOS ENDPOINTS PARA OPERADOR Y ASIGNACIÓN DE MENSAJEROS
# ============================================================

@packages_bp.route('/mensajeros', methods=['GET'])
@jwt_required()
def get_mensajeros():
    """
    Obtiene la lista de usuarios con rol de mensajero
    """
    try:
        from app.models import RolUsuario
        
        mensajeros = Usuario.query.filter(
            Usuario.rol == RolUsuario.MENSAJERO,
            Usuario.activo == True
        ).all()
        
        return jsonify({
            'success': True,
            'total': len(mensajeros),
            'mensajeros': [{
                'rut': m.rut,
                'nombre_completo': m.nombre_completo,
                'activo': m.activo
            } for m in mensajeros]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error al obtener mensajeros: {str(e)}'}), 500


@packages_bp.route('/<id_activo>/asignar', methods=['PATCH'])
@jwt_required()
def asignar_mensajero(id_activo):
    """
    Asigna un mensajero a un paquete/activo en estado EN_ACOPIO
    Cambia el estado a EN_ACOPIO_ASIGNADO
    """
    try:
        rut_actual = get_jwt()
        if not rut_actual:
            return jsonify({'error': 'Token inválido'}), 401
        
        rut_actual = rut_actual.get('rut')
        
        activo = Activo.query.filter_by(id_activo=id_activo).first()
        if not activo:
            return jsonify({'error': f'Activo con ID {id_activo} no encontrado'}), 404
        
        # Validar estado EN_ACOPIO
        if activo.estado_actual != EstadoActivo.EN_ACOPIO:
            return jsonify({
                'error': f'No se puede asignar mensajero. El paquete está en estado "{activo.estado_actual.value}" y debe estar en "en_acopio"'
            }), 400
        
        if activo.is_blocked:
            return jsonify({
                'error': 'El paquete está bloqueado por una incidencia. No se puede asignar mensajero.'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        rut_mensajero = data.get('rut_mensajero')
        if not rut_mensajero:
            return jsonify({'error': 'El campo "rut_mensajero" es obligatorio'}), 400
        
        from app.models import RolUsuario
        mensajero = Usuario.query.filter_by(
            rut=rut_mensajero,
            rol=RolUsuario.MENSAJERO,
            activo=True
        ).first()
        
        if not mensajero:
            return jsonify({'error': f'Mensajero con RUT {rut_mensajero} no encontrado o no está activo'}), 404
        
        activo.estado_actual = EstadoActivo.EN_ACOPIO_ASIGNADO
        activo.rut_mensajero = rut_mensajero
        activo.tiempo_asignacion = datetime.utcnow()
        activo.updated_at = datetime.utcnow()
        
        # Registrar log
        custody_log = CustodyLog(
            id_activo=id_activo,
            rut_responsable=rut_actual,
            estado_instante=activo.estado_actual.value,
            tipo_alerta='estándar',
            is_offline_sync=False
        )
        db.session.add(custody_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Mensajero {rut_mensajero} asignado exitosamente',
            'asset': activo.to_dict(),
            'log': custody_log.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al asignar mensajero: {str(e)}'}), 500


@packages_bp.route('/<id_activo>/incidencias', methods=['POST'])
@jwt_required()
def report_incidence(id_activo):
    """
    Reporta una incidencia para un paquete/activo
    """
    try:
        rut_actual = get_jwt()
        if not rut_actual:
            return jsonify({'error': 'Token inválido'}), 401
        
        rut_actual = rut_actual.get('rut')
        
        activo = Activo.query.filter_by(id_activo=id_activo).first()
        if not activo:
            return jsonify({'error': f'Activo con ID {id_activo} no encontrado'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Cuerpo de solicitud vacío'}), 400
        
        motivo = data.get('motivo')
        descripcion = data.get('descripcion')
        
        if not motivo:
            return jsonify({'error': 'El campo "motivo" es obligatorio'}), 400
        if not descripcion:
            return jsonify({'error': 'El campo "descripcion" es obligatorio'}), 400
        
        activo.is_blocked = True
        
        if activo.estado_actual != EstadoActivo.EN_DISPUTA:
            activo.estado_actual = EstadoActivo.EN_DISPUTA
        
        activo.updated_at = datetime.utcnow()
        
        # 👇 GUARDAR LA DESCRIPCIÓN COMPLETA EN EL LOG
        descripcion_log = f"INCIDENCIA REPORTADA - Motivo: {motivo} - Descripción: {descripcion}"
        
        custody_log = CustodyLog(
            id_activo=id_activo,
            rut_responsable=rut_actual,
            estado_instante=activo.estado_actual.value,
            tipo_alerta='crítico',
            is_offline_sync=False,
            descripcion=descripcion_log  # 👈 Guardar la descripción completa
        )
        db.session.add(custody_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Incidencia reportada exitosamente. El paquete ha sido bloqueado.',
            'is_blocked': True,
            'estado': activo.estado_actual.value,
            'log': custody_log.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al reportar incidencia: {str(e)}'}), 500


@packages_bp.route('/<id_activo>/tiempo-restante', methods=['GET'])
@jwt_required()
def get_tiempo_restante(id_activo):
    """
    Obtiene el tiempo restante para la asignación del mensajero (2 horas)
    """
    try:
        activo = Activo.query.filter_by(id_activo=id_activo).first()
        
        if not activo:
            return jsonify({'error': f'Activo con ID {id_activo} no encontrado'}), 404
        
        if not activo.tiempo_asignacion or not activo.rut_mensajero:
            return jsonify({
                'success': True,
                'tiene_asignacion': False
            }), 200
        
        tiempo_actual = datetime.utcnow()
        tiempo_asignacion = activo.tiempo_asignacion
        segundos_transcurridos = (tiempo_actual - tiempo_asignacion).total_seconds()
        segundos_restantes = max(0, 7200 - segundos_transcurridos)
        
        return jsonify({
            'success': True,
            'tiene_asignacion': True,
            'rut_mensajero': activo.rut_mensajero,
            'tiempo_asignacion': tiempo_asignacion.isoformat(),
            'segundos_restantes': int(segundos_restantes),
            'expirado': segundos_restantes <= 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error al obtener tiempo restante: {str(e)}'}), 500

@packages_bp.route('/my-assigned', methods=['GET'])
@jwt_required()
def get_my_assigned_packages():
    """
    Obtiene los paquetes asignados al mensajero autenticado
    Filtra por estado EN_ACOPIO_ASIGNADO y rut_mensajero = usuario actual
    """
    try:
        claims = get_jwt()
        rut_mensajero = claims.get('rut')
        
        if not rut_mensajero:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Filtrar paquetes asignados al mensajero actual
        paquetes = Activo.query.filter(
            Activo.estado_actual == EstadoActivo.EN_ACOPIO_ASIGNADO,
            Activo.rut_mensajero == rut_mensajero
        ).order_by(Activo.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'total': len(paquetes),
            'packages': [pkg.to_dict() for pkg in paquetes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error al obtener paquetes asignados: {str(e)}'}), 500